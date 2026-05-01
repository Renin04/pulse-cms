import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthAndPermission, ApiError } from "@/lib/api-utils";
import { jsonResponse, handleApiError, logAudit } from "@/lib/api-utils";

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
  return {
    ...entry,
    fieldValues: safeJsonParse(entry.fieldValues, {}),
    blocks: safeJsonParse(entry.blocks, []),
    metadata: safeJsonParse(entry.metadata, {}),
  };
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.create");
    const { id } = await context.params;

    const entry = await prisma.entry.findUnique({
      where: { id },
      include: {
        taxonomyLinks: true,
        contentType: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!entry) {
      throw new ApiError("NOT_FOUND", "Entry not found", 404);
    }

    const newSlug = `${entry.slug}-copy`;

    const existing = await prisma.entry.findUnique({
      where: { slug_contentTypeId: { slug: newSlug, contentTypeId: entry.contentTypeId } },
    });
    if (existing) {
      throw new ApiError("DUPLICATE_SLUG", "An entry with the copied slug already exists", 409);
    }

    const newEntry = await prisma.entry.create({
      data: {
        contentTypeId: entry.contentTypeId,
        title: `${entry.title} (Copy)`,
        slug: newSlug,
        status: "draft",
        fieldValues: entry.fieldValues,
        blocks: entry.blocks,
        metadata: entry.metadata,
        authorId: ctx.userId,
        parentId: entry.parentId,
      },
      include: {
        contentType: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, displayName: true, email: true } },
      },
    });

    if (entry.taxonomyLinks.length > 0) {
      await prisma.entryTaxonomyTerm.createMany({
        data: entry.taxonomyLinks.map((link: any) => ({
          entryId: newEntry.id,
          termId: link.termId,
        })),
      });
    }

    await logAudit("duplicate", "entry", {
      userId: ctx.userId,
      entryId: newEntry.id,
      resourceId: id,
      req,
    });

    return jsonResponse(serializeEntry(newEntry), 201);
  } catch (err) {
    return handleApiError(err);
  }
}
