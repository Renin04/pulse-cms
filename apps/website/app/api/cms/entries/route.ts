import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthAndPermission, ApiError } from "@/lib/api-utils";
import { jsonResponse, handleApiError, parseQueryInt, logAudit } from "@/lib/api-utils";
import { validateBlocks } from "@/lib/block-validator";

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function serializeEntry(entry: any) {
  if (!entry) return entry;
  const { taxonomyLinks, ...rest } = entry;
  return {
    ...rest,
    fieldValues: safeJsonParse(entry.fieldValues, {}),
    blocks: safeJsonParse(entry.blocks, []),
    metadata: safeJsonParse(entry.metadata, {}),
    taxonomyIds: taxonomyLinks?.map((link: any) => link.termId) ?? [],
    taxonomyTerms: taxonomyLinks?.map((link: any) => ({
      id: link.term.id,
      name: link.term.name,
      slug: link.term.slug,
      taxonomyId: link.term.taxonomyId,
      taxonomyName: link.term.taxonomy?.name,
    })) ?? [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const _ctx = await requireAuthAndPermission(req, "content.read");

    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") || undefined;
    const contentTypeId = searchParams.get("contentTypeId") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseQueryInt(req, "page", 1);
    const limit = parseQueryInt(req, "limit", 20);
    const sortBy = searchParams.get("sortBy") || "updatedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where: any = {};
    if (status) where.status = status;
    if (contentTypeId) where.contentTypeId = contentTypeId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          contentType: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, displayName: true, email: true } },
          taxonomyLinks: {
            include: {
              term: {
                include: {
                  taxonomy: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
        },
      }),
      prisma.entry.count({ where }),
    ]);

    return jsonResponse({
      items: entries.map(serializeEntry),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.create");
    const body = await req.json();

    const {
      contentTypeId,
      title,
      slug,
      status,
      fieldValues,
      blocks,
      metadata,
      authorId,
      publishedAt,
      scheduledAt,
      parentId,
    } = body;

    if (!contentTypeId || !title || !slug) {
      throw new ApiError("INVALID_INPUT", "contentTypeId, title, and slug are required", 400);
    }

    let resolvedContentTypeId = contentTypeId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contentTypeId);
    if (!isUuid) {
      const contentType = await prisma.contentType.findUnique({
        where: { slug: contentTypeId },
      });
      if (!contentType) {
        throw new ApiError("INVALID_INPUT", `Content type not found: ${contentTypeId}`, 400);
      }
      resolvedContentTypeId = contentType.id;
    }

    const existing = await prisma.entry.findUnique({
      where: { slug_contentTypeId: { slug, contentTypeId: resolvedContentTypeId } },
    });
    if (existing) {
      throw new ApiError("DUPLICATE_SLUG", "An entry with this slug already exists for this content type", 409);
    }

    if (blocks && Array.isArray(blocks)) {
      const validation = validateBlocks(blocks);
      if (!validation.valid) {
        throw new ApiError(
          "INVALID_BLOCKS",
          `Block validation failed: ${validation.errors.map((e) => `[${e.blockType}] ${e.message}`).join("; ")}`,
          400,
          { blocks: validation.errors.map((e) => `${e.blockType}: ${e.message}`) }
        );
      }
    }

    const entry = await prisma.entry.create({
      data: {
        contentTypeId: resolvedContentTypeId,
        title,
        slug,
        status: status || "draft",
        fieldValues: fieldValues ? JSON.stringify(fieldValues) : "{}",
        blocks: blocks ? JSON.stringify(blocks) : undefined,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        authorId: authorId || ctx.userId,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        parentId: parentId || undefined,
      },
      include: {
        contentType: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, displayName: true, email: true } },
      },
    });

    await logAudit("create", "entry", { userId: ctx.userId, entryId: entry.id, req });

    return jsonResponse(serializeEntry(entry), 201);
  } catch (err) {
    return handleApiError(err);
  }
}
