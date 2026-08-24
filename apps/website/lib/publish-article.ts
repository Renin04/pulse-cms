/**
 * Article publishing helpers — shared by `POST /api/cms/publish-article`
 * and its Vitest suite.
 *
 * Pure logic only (no Prisma, no Next): request-body schema, bearer-token
 * comparison, slug resolution, block validation against the real
 * `@pulse/blocks` zod schemas, and the Entry write-data builder that mirrors
 * `scripts/seed-persian-articles.mts`.
 *
 * Note: @pulse/blocks uses zod v3 while this app uses zod v4, so the block
 * schemas are duck-typed at runtime (same approach as lib/block-validator.ts).
 */

import { createHash, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { BUILTIN_BLOCK_DEFINITIONS } from "@pulse/blocks";

/* ── Bearer token ─────────────────────────────────────────────────────── */

/**
 * Constant-time token comparison. Both sides are SHA-256 hashed first so the
 * comparison never leaks length and always runs in fixed time.
 */
export function verifyContentApiToken(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = createHash("sha256").update(provided, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/* ── Slug ─────────────────────────────────────────────────────────────── */

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Best-effort Latin kebab-case slug. Returns "" when the title has no Latin chars. */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "");
}

export type SlugResolution = { ok: true; slug: string } | { ok: false; message: string };

/**
 * Resolve the final slug: the explicit one wins; otherwise derive it from the
 * title. Persian (or any non-Latin) titles slugify to an empty string, so an
 * explicit slug is required for them.
 */
export function resolveArticleSlug(title: string, explicitSlug?: string): SlugResolution {
  if (explicitSlug) return { ok: true, slug: explicitSlug };
  const derived = slugifyTitle(title);
  if (derived.length >= 3) return { ok: true, slug: derived };
  return {
    ok: false,
    message:
      'Could not derive a Latin slug from this title. For Persian titles, pass an explicit kebab-case "slug" (e.g. "vitamin-d-guide").',
  };
}

/* ── Request body schema (zod v4) ─────────────────────────────────────── */

const articleBlockInputSchema = z.object({
  id: z.string().min(1).max(120).optional(),
  type: z.string().min(1).max(60),
  data: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const publishArticleBodySchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .min(3)
    .max(120)
    .regex(SLUG_REGEX, "slug must be kebab-case (a-z, 0-9, hyphens)")
    .optional(),
  excerpt: z.string().max(500).optional(),
  tags: z.array(z.string().min(1).max(50)).max(6).optional(),
  coverImage: z
    .string()
    .max(500)
    .regex(
      /^(\/assets\/\S+|\/api\/media\/\S+|https:\/\/\S+)$/,
      "coverImage must be a path under /assets/ or /api/media/ or an https URL",
    )
    .optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  publishedAt: z.iso.datetime().optional(),
  blocks: z.array(articleBlockInputSchema).min(1).max(200),
});

export type PublishArticleBody = z.infer<typeof publishArticleBodySchema>;
export type ArticleBlockInput = z.infer<typeof articleBlockInputSchema>;

/* ── Block validation against @pulse/blocks schemas ───────────────────── */

interface DuckTypedSchema {
  safeParse(data: unknown): {
    success: boolean;
    error?: { issues: Array<{ path: (string | number)[]; message: string }> };
  };
}

const blockSchemaMap = new Map<string, DuckTypedSchema>();
for (const def of BUILTIN_BLOCK_DEFINITIONS as unknown as Array<{
  type: string;
  schema?: DuckTypedSchema;
}>) {
  if (def.schema && typeof def.schema.safeParse === "function") {
    blockSchemaMap.set(def.type, def.schema);
  }
}

export interface ArticleBlockError {
  blockIndex: number;
  blockType: string;
  message: string;
}

export interface ArticleBlockValidation {
  valid: boolean;
  errors: ArticleBlockError[];
}

/**
 * Validate every block's `data` against the built-in Pulse block schema for
 * its `type`. Unknown types are rejected — a typo'd type would otherwise be
 * stored fine and then render as nothing on the public page.
 */
export function validateArticleBlocks(
  blocks: NormalizedArticleBlock[],
): ArticleBlockValidation {
  const errors: ArticleBlockError[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const schema = blockSchemaMap.get(block.type);
    if (!schema) {
      errors.push({
        blockIndex: i,
        blockType: block.type,
        message: `Unknown block type "${block.type}"`,
      });
      continue;
    }
    const result = schema.safeParse(block.data);
    if (!result.success && result.error) {
      errors.push({
        blockIndex: i,
        blockType: block.type,
        message: result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(" | "),
      });
    }
  }
  return { valid: errors.length === 0, errors };
}

/* ── Block normalization ──────────────────────────────────────────────── */

export interface NormalizedArticleBlock {
  id: string;
  type: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fill block defaults the way the seed script's `B()` helper does. Ids are
 * derived from slug + position so re-POSTing the same article JSON stores
 * byte-identical blocks (idempotent updates, no id churn).
 */
export function normalizeArticleBlocks(
  blocks: ArticleBlockInput[],
  slug: string,
  now = new Date(),
): NormalizedArticleBlock[] {
  const iso = now.toISOString();
  return blocks.map((block, index) => ({
    id: block.id ?? `b-${slug}-${index}`,
    type: block.type,
    data: block.data,
    createdAt: block.createdAt ?? iso,
    updatedAt: block.updatedAt ?? iso,
  }));
}

/* ── Entry write-data builder (mirrors the seed script's shape) ───────── */

export const BLOG_CONTENT_TYPE_SLUG = "blog_post";
export const BLOG_TAXONOMY_SLUG = "blog-tags";
export const BLOG_TAXONOMY_NAME = "برچسب‌های وبلاگ";
export const DEFAULT_AUTHOR = "Pulse Editorial";
export const DEFAULT_EYEBROW = "Blog";

export interface ArticleWriteData {
  title: string;
  slug: string;
  status: "draft" | "published";
  publishedAt: Date | null;
  fieldValues: string;
  blocks: string;
  metadata: string;
  origin: string;
}

export function buildArticleWriteData(
  body: PublishArticleBody,
  slug: string,
  blocks: NormalizedArticleBlock[],
  now = new Date(),
): ArticleWriteData {
  const tags = body.tags ?? [];
  const excerpt = body.excerpt ?? "";
  const cover = body.coverImage ?? "";
  const published = body.status === "published";

  const fieldValues = [
    { fieldId: "excerpt", value: excerpt },
    { fieldId: "eyebrow", value: tags[0] ?? DEFAULT_EYEBROW },
    { fieldId: "author", value: DEFAULT_AUTHOR },
    { fieldId: "tags", value: tags },
    { fieldId: "featured", value: false },
    { fieldId: "featuredImage", value: cover },
    { fieldId: "featuredImageAlt", value: body.title },
  ];

  const metadata = {
    seoTitle: body.title,
    seoDescription: excerpt,
    seoKeywords: tags.join(", "),
    ogImage: cover,
    canonicalUrl: `/blog/${slug}`,
  };

  return {
    title: body.title,
    slug,
    status: body.status,
    publishedAt: published ? (body.publishedAt ? new Date(body.publishedAt) : now) : null,
    fieldValues: JSON.stringify(fieldValues),
    blocks: JSON.stringify(blocks),
    metadata: JSON.stringify(metadata),
    origin: "real",
  };
}
