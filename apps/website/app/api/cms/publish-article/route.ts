/**
 * POST /api/cms/publish-article
 *
 * Token-authenticated article publishing endpoint: the site owner drafts
 * article JSON locally (see docs/ARTICLE_WORKFLOW.md) and pushes it here via
 * scripts/publish-article.mjs until Pulse's Phase-4 AI drafting exists.
 *
 * Auth: `Authorization: Bearer <CONTENT_API_TOKEN>` (constant-time compare).
 * Idempotent upsert by (slug, blog_post content type) — re-POSTing the same
 * slug updates the entry in place and rebuilds its taxonomy links.
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  BLOG_CONTENT_TYPE_SLUG,
  BLOG_TAXONOMY_NAME,
  BLOG_TAXONOMY_SLUG,
  buildArticleWriteData,
  normalizeArticleBlocks,
  publishArticleBodySchema,
  resolveArticleSlug,
  validateArticleBlocks,
  verifyContentApiToken,
} from "@/lib/publish-article";

// 30 publishes per 15 min per IP — interactive drafting cadence, not bulk import.
const MAX_PUBLISH_REQUESTS = 30;

export async function POST(req: NextRequest) {
  // 0 · Endpoint must be configured — missing token env disables it entirely.
  const expectedToken = process.env.CONTENT_API_TOKEN;
  if (!expectedToken) {
    console.error("[publish-article] CONTENT_API_TOKEN is not set — endpoint disabled");
    return NextResponse.json(
      {
        error: "service_unavailable",
        message: "Publishing endpoint is not configured on this server",
      },
      { status: 503 },
    );
  }

  // 1 · Rate limit
  const identifier = req.ip || req.headers.get("x-forwarded-for") || "anonymous";
  const limit = checkRateLimit(`publish:${identifier}`, MAX_PUBLISH_REQUESTS);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        retryAfter: Math.ceil((limit.resetAt - Date.now()) / 1000),
      },
      { status: 429 },
    );
  }

  // 2 · Bearer auth (constant-time)
  const authHeader = req.headers.get("authorization") ?? "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!verifyContentApiToken(provided, expectedToken)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 3 · Body
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_body", message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }
  const parsed = publishArticleBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "invalid_body",
        details: parsed.error.issues.map(
          (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
        ),
      },
      { status: 400 },
    );
  }
  const body = parsed.data;

  // 4 · Slug (explicit, or derived from a Latin title)
  const slugResult = resolveArticleSlug(body.title, body.slug);
  if (!slugResult.ok) {
    return NextResponse.json(
      { error: "slug_required", message: slugResult.message },
      { status: 400 },
    );
  }
  const slug = slugResult.slug;

  // 5 · Validate every block against its @pulse/blocks schema
  const blocks = normalizeArticleBlocks(body.blocks, slug);
  const validation = validateArticleBlocks(blocks);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "invalid_blocks", details: validation.errors },
      { status: 422 },
    );
  }

  try {
    // 6 · Blog content type
    const contentType = await prisma.contentType.findUnique({
      where: { slug: BLOG_CONTENT_TYPE_SLUG },
    });
    if (!contentType) {
      console.error("[publish-article] content type blog_post missing — run prisma seed");
      return NextResponse.json(
        { error: "server_error", message: "Blog content type is not configured" },
        { status: 500 },
      );
    }

    // 7 · Taxonomy + terms (dedup tags by derived term slug)
    const tagBySlug = new Map<string, string>();
    for (const name of body.tags ?? []) {
      const termSlug = name.replace(/\s+/g, "-");
      if (!tagBySlug.has(termSlug)) tagBySlug.set(termSlug, name);
    }
    const termIds: string[] = [];
    if (tagBySlug.size > 0) {
      const taxonomy = await prisma.taxonomy.upsert({
        where: { slug: BLOG_TAXONOMY_SLUG },
        update: {},
        create: {
          name: BLOG_TAXONOMY_NAME,
          slug: BLOG_TAXONOMY_SLUG,
          type: "tag",
          config: "{}",
        },
      });
      for (const [termSlug, name] of tagBySlug) {
        const term = await prisma.taxonomyTerm.upsert({
          where: { taxonomyId_slug: { taxonomyId: taxonomy.id, slug: termSlug } },
          update: { name },
          create: { taxonomyId: taxonomy.id, name, slug: termSlug },
        });
        termIds.push(term.id);
      }
    }

    // 8 · Upsert the entry by (slug, blog content type)
    const data = {
      contentTypeId: contentType.id,
      ...buildArticleWriteData(body, slug, blocks),
    };
    const existing = await prisma.entry.findFirst({
      where: { slug, contentTypeId: contentType.id },
    });
    const entry = existing
      ? await prisma.entry.update({ where: { id: existing.id }, data })
      : await prisma.entry.create({ data });

    // 9 · Rebuild taxonomy links for this entry
    await prisma.entryTaxonomyTerm.deleteMany({ where: { entryId: entry.id } });
    if (termIds.length > 0) {
      await prisma.entryTaxonomyTerm.createMany({
        data: termIds.map((termId) => ({ entryId: entry.id, termId })),
      });
    }

    // 10 · Bust ISR caches — prerendered pages carry s-maxage=1y, so without
    // on-demand revalidation edits would stay stale in production.
    try {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/blog");
      revalidatePath(`/blog/${slug}`);
      revalidatePath("/sitemap.xml");
    } catch (revalErr) {
      console.warn("[publish-article] revalidate failed (non-fatal):", revalErr);
    }

    return NextResponse.json(
      {
        status: "ok",
        id: entry.id,
        slug,
        url: `/blog/${slug}`,
        action: existing ? "updated" : "created",
      },
      { status: existing ? 200 : 201 },
    );
  } catch (err) {
    console.error("[publish-article] Unhandled error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
