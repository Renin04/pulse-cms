import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildArticleWriteData,
  normalizeArticleBlocks,
  publishArticleBodySchema,
  resolveArticleSlug,
  slugifyTitle,
  validateArticleBlocks,
  verifyContentApiToken,
} from "./publish-article";

vi.mock("@/lib/db", () => ({
  prisma: {
    contentType: { findUnique: vi.fn() },
    taxonomy: { upsert: vi.fn() },
    taxonomyTerm: { upsert: vi.fn() },
    entry: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    entryTaxonomyTerm: { deleteMany: vi.fn(), createMany: vi.fn() },
  },
}));

// The route imports "@/lib/publish-article"; vitest has no "@" alias, so
// re-export the real implementation via its relative path.
vi.mock("@/lib/publish-article", async () => await import("./publish-article"));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({
    allowed: true,
    remaining: 29,
    resetAt: Date.now() + 900_000,
  })),
}));

import { POST } from "../app/api/cms/publish-article/route";
import { prisma } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

const TEST_TOKEN = "test-content-token-0123456789abcdef";
const ORIGINAL_ENV = process.env.CONTENT_API_TOKEN;

const contentTypeFindUnique = vi.mocked(prisma.contentType.findUnique);
const taxonomyUpsert = vi.mocked(prisma.taxonomy.upsert);
const taxonomyTermUpsert = vi.mocked(prisma.taxonomyTerm.upsert);
const entryFindFirst = vi.mocked(prisma.entry.findFirst);
const entryCreate = vi.mocked(prisma.entry.create);
const entryUpdate = vi.mocked(prisma.entry.update);
const entryTaxonomyDeleteMany = vi.mocked(prisma.entryTaxonomyTerm.deleteMany);
const entryTaxonomyCreateMany = vi.mocked(prisma.entryTaxonomyTerm.createMany);
const rateLimit = vi.mocked(checkRateLimit);

function makeRequest(body: string, token?: string): NextRequest {
  const headers = new Headers({ "content-type": "application/json" });
  if (token) headers.set("authorization", `Bearer ${token}`);
  return {
    headers,
    json: async () => JSON.parse(body),
  } as unknown as NextRequest;
}

const TXT = (text: string) => ({
  text,
  marks: { bold: false, italic: false, underline: false, code: false },
});

const validBody = {
  title: "راهنمای ساده مصرف دارو",
  slug: "simple-medication-guide",
  excerpt: "خلاصه‌ی کوتاه مقاله برای تست.",
  tags: ["دارو", "سلامتی"],
  status: "published",
  blocks: [
    { type: "heading", data: { text: "مقدمه", level: 2 } },
    { type: "text", data: TXT("این یک متن آزمایشی است.") },
    { type: "callout", data: { variant: "note", body: "یادآوری مهم" } },
  ],
};

function mockHappyPath(existing: { id: string } | null) {
  contentTypeFindUnique.mockResolvedValue({ id: "ct_blog" } as never);
  taxonomyUpsert.mockResolvedValue({ id: "tax_1" } as never);
  taxonomyTermUpsert.mockResolvedValue({ id: "term_1" } as never);
  entryFindFirst.mockResolvedValue(existing as never);
  entryCreate.mockResolvedValue({ id: "entry_new" } as never);
  entryUpdate.mockResolvedValue({ id: "entry_existing" } as never);
  entryTaxonomyDeleteMany.mockResolvedValue({ count: 0 } as never);
  entryTaxonomyCreateMany.mockResolvedValue({ count: 1 } as never);
}

/* ── Pure helpers ─────────────────────────────────────────────────────── */

describe("verifyContentApiToken", () => {
  it("accepts identical tokens", () => {
    expect(verifyContentApiToken("s3cr3t", "s3cr3t")).toBe(true);
  });

  it("rejects different tokens of the same length", () => {
    expect(verifyContentApiToken("s3cr3t", "s3cr3x")).toBe(false);
  });

  it("rejects tokens of different lengths", () => {
    expect(verifyContentApiToken("short", "a-much-longer-secret")).toBe(false);
  });

  it("rejects empty input", () => {
    expect(verifyContentApiToken("", "s3cr3t")).toBe(false);
    expect(verifyContentApiToken("s3cr3t", "")).toBe(false);
  });
});

describe("slugifyTitle / resolveArticleSlug", () => {
  it("slugifies a Latin title", () => {
    expect(slugifyTitle("Vitamin D, Who Needs Supplements?")).toBe(
      "vitamin-d-who-needs-supplements",
    );
  });

  it("returns an empty string for a Persian title", () => {
    expect(slugifyTitle("ویتامین D؟ نه — فقط فارسی")).toBe("d");
    expect(slugifyTitle("چطور داروها را درست مصرف کنیم؟")).toBe("");
  });

  it("prefers the explicit slug", () => {
    expect(resolveArticleSlug("Hello World", "my-custom-slug")).toEqual({
      ok: true,
      slug: "my-custom-slug",
    });
  });

  it("derives a slug from a Latin title", () => {
    expect(resolveArticleSlug("Hello World")).toEqual({ ok: true, slug: "hello-world" });
  });

  it("requires an explicit slug for a Persian title", () => {
    const result = resolveArticleSlug("چطور داروها را درست مصرف کنیم؟");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/slug/i);
  });
});

describe("validateArticleBlocks", () => {
  it("accepts valid built-in blocks", () => {
    const blocks = normalizeArticleBlocks(
      [
        { type: "text", data: TXT("سلام") },
        { type: "heading", data: { text: "عنوان", level: 2 } },
      ],
      "test-slug",
    );
    expect(validateArticleBlocks(blocks)).toEqual({ valid: true, errors: [] });
  });

  it("rejects an unknown block type", () => {
    const blocks = normalizeArticleBlocks(
      [{ type: "not-a-block", data: {} }],
      "test-slug",
    );
    const result = validateArticleBlocks(blocks);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatchObject({ blockIndex: 0, blockType: "not-a-block" });
  });

  it("reports schema errors with the block index and path", () => {
    const blocks = normalizeArticleBlocks(
      [
        { type: "text", data: TXT("ok") },
        { type: "callout", data: { variant: "note" } }, // missing required body
      ],
      "test-slug",
    );
    const result = validateArticleBlocks(blocks);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].blockIndex).toBe(1);
    expect(result.errors[0].blockType).toBe("callout");
    expect(result.errors[0].message).toContain("body");
  });
});

describe("buildArticleWriteData", () => {
  const slug = "simple-medication-guide";
  const blocks = normalizeArticleBlocks(validBody.blocks, slug);

  it("defaults publishedAt to now when published without a date", () => {
    const now = new Date("2026-07-27T10:00:00.000Z");
    const body = publishArticleBodySchema.parse(validBody);
    const data = buildArticleWriteData(body, slug, blocks, now);
    expect(data.status).toBe("published");
    expect(data.publishedAt).toEqual(now);
  });

  it("honours an explicit publishedAt", () => {
    const body = publishArticleBodySchema.parse({
      ...validBody,
      publishedAt: "2026-07-20T09:00:00.000Z",
    });
    const data = buildArticleWriteData(body, slug, blocks);
    expect(data.publishedAt).toEqual(new Date("2026-07-20T09:00:00.000Z"));
  });

  it("stores null publishedAt for drafts", () => {
    const body = publishArticleBodySchema.parse({ ...validBody, status: "draft" });
    expect(buildArticleWriteData(body, slug, blocks).publishedAt).toBeNull();
  });

  it("serializes fieldValues/blocks/metadata like the seed script", () => {
    const body = publishArticleBodySchema.parse(validBody);
    const data = buildArticleWriteData(body, slug, blocks);
    const fieldValues = JSON.parse(data.fieldValues) as Array<{
      fieldId: string;
      value: unknown;
    }>;
    const byId = Object.fromEntries(fieldValues.map((f) => [f.fieldId, f.value]));
    expect(byId.excerpt).toBe(validBody.excerpt);
    expect(byId.tags).toEqual(validBody.tags);
    expect(byId.featured).toBe(false);
    expect(JSON.parse(data.blocks)).toHaveLength(3);
    expect(JSON.parse(data.metadata)).toMatchObject({ canonicalUrl: `/blog/${slug}` });
  });
});

/* ── Route ────────────────────────────────────────────────────────────── */

describe("POST /api/cms/publish-article", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CONTENT_API_TOKEN = TEST_TOKEN;
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) delete process.env.CONTENT_API_TOKEN;
    else process.env.CONTENT_API_TOKEN = ORIGINAL_ENV;
  });

  it("returns 503 when CONTENT_API_TOKEN is not configured", async () => {
    delete process.env.CONTENT_API_TOKEN;
    const res = await POST(makeRequest(JSON.stringify(validBody), TEST_TOKEN));
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe("service_unavailable");
    expect(JSON.stringify(json)).not.toContain("CONTENT_API_TOKEN");
  });

  it("returns 401 without an Authorization header", async () => {
    const res = await POST(makeRequest(JSON.stringify(validBody)));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("returns 401 for a wrong token", async () => {
    const res = await POST(makeRequest(JSON.stringify(validBody), "wrong-token"));
    expect(res.status).toBe(401);
    expect(entryFindFirst).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    rateLimit.mockReturnValueOnce({
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    });
    const res = await POST(makeRequest(JSON.stringify(validBody), TEST_TOKEN));
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toBe("rate_limited");
    expect(json.retryAfter).toBeGreaterThan(0);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await POST(makeRequest("{not json", TEST_TOKEN));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "invalid_body",
      message: "Request body must be valid JSON",
    });
  });

  it("returns 400 with details for a schema-invalid body", async () => {
    const res = await POST(
      makeRequest(JSON.stringify({ title: "ab", blocks: [] }), TEST_TOKEN),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("invalid_body");
    expect(json.details.length).toBeGreaterThan(0);
  });

  it("returns 400 slug_required for a Persian title without a slug", async () => {
    const { slug: _omit, ...noSlug } = validBody;
    const res = await POST(makeRequest(JSON.stringify(noSlug), TEST_TOKEN));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("slug_required");
    expect(entryFindFirst).not.toHaveBeenCalled();
  });

  it("returns 422 with per-block details for invalid blocks", async () => {
    const body = {
      ...validBody,
      blocks: [
        { type: "text", data: TXT("ok") },
        { type: "callout", data: { variant: "note" } }, // missing required body
        { type: "made-up-type", data: {} },
      ],
    };
    const res = await POST(makeRequest(JSON.stringify(body), TEST_TOKEN));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("invalid_blocks");
    expect(json.details).toHaveLength(2);
    expect(json.details[0]).toMatchObject({ blockIndex: 1, blockType: "callout" });
    expect(json.details[1]).toMatchObject({ blockIndex: 2, blockType: "made-up-type" });
    expect(entryFindFirst).not.toHaveBeenCalled();
  });

  it("creates a new entry and returns 201 created", async () => {
    mockHappyPath(null);
    const res = await POST(makeRequest(JSON.stringify(validBody), TEST_TOKEN));
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({
      status: "ok",
      id: "entry_new",
      slug: validBody.slug,
      url: `/blog/${validBody.slug}`,
      action: "created",
    });

    expect(entryFindFirst).toHaveBeenCalledWith({
      where: { slug: validBody.slug, contentTypeId: "ct_blog" },
    });
    expect(entryCreate).toHaveBeenCalledTimes(1);
    const createArg = entryCreate.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(createArg.data).toMatchObject({
      contentTypeId: "ct_blog",
      title: validBody.title,
      slug: validBody.slug,
      status: "published",
    });
    expect(entryUpdate).not.toHaveBeenCalled();

    // Taxonomy links rebuilt: delete + create per tag
    expect(entryTaxonomyDeleteMany).toHaveBeenCalledWith({
      where: { entryId: "entry_new" },
    });
    expect(entryTaxonomyCreateMany).toHaveBeenCalledTimes(1);
    const linksArg = entryTaxonomyCreateMany.mock.calls[0][0] as {
      data: Array<{ entryId: string; termId: string }>;
    };
    expect(linksArg.data).toEqual([
      { entryId: "entry_new", termId: "term_1" },
      { entryId: "entry_new", termId: "term_1" },
    ]);
  });

  it("updates an existing entry in place and returns 200 updated", async () => {
    mockHappyPath({ id: "entry_existing" });
    const res = await POST(makeRequest(JSON.stringify(validBody), TEST_TOKEN));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.action).toBe("updated");
    expect(json.id).toBe("entry_existing");

    expect(entryUpdate).toHaveBeenCalledTimes(1);
    const updateArg = entryUpdate.mock.calls[0][0] as { where: { id: string } };
    expect(updateArg.where).toEqual({ id: "entry_existing" });
    expect(entryCreate).not.toHaveBeenCalled();
    expect(entryTaxonomyDeleteMany).toHaveBeenCalledWith({
      where: { entryId: "entry_existing" },
    });
  });

  it("derives the slug from a Latin title when omitted", async () => {
    mockHappyPath(null);
    const body = { title: "Winter Flu Season Guide", blocks: validBody.blocks };
    const res = await POST(makeRequest(JSON.stringify(body), TEST_TOKEN));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.slug).toBe("winter-flu-season-guide");
    expect(json.url).toBe("/blog/winter-flu-season-guide");
  });

  it("returns 500 when the blog_post content type is missing", async () => {
    contentTypeFindUnique.mockResolvedValue(null as never);
    const res = await POST(makeRequest(JSON.stringify(validBody), TEST_TOKEN));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("server_error");
    expect(entryFindFirst).not.toHaveBeenCalled();
  });

  it("returns 500 without leaking internals when the database fails", async () => {
    contentTypeFindUnique.mockRejectedValue(
      new Error("db is down: connection string postgres://user:pass@host") as never,
    );
    const res = await POST(makeRequest(JSON.stringify(validBody), TEST_TOKEN));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: "server_error" });
    expect(JSON.stringify(json)).not.toContain("postgres");
  });
});
