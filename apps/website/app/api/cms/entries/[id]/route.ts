import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthAndPermission, ApiError } from "@/lib/api-utils";
import { jsonResponse, handleApiError, logAudit } from "@/lib/api-utils";
import { validateBlocks } from "@/lib/block-validator";
import { assertEntryAccess } from "@/lib/entry-access";

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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.read");
    const { id } = await context.params;

    const entry = await prisma.entry.findUnique({
      where: { id },
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
    });

    if (!entry) {
      throw new ApiError("NOT_FOUND", "Entry not found", 404);
    }

    assertEntryAccess(ctx, entry, "read");

    const serialized = serializeEntry(entry);
    serialized.taxonomyTerms = entry.taxonomyLinks.map((link: any) => ({
      id: link.term.id,
      name: link.term.name,
      slug: link.term.slug,
      taxonomy: link.term.taxonomy,
    }));
    serialized.taxonomyIds = entry.taxonomyLinks.map((link: any) => link.termId);

    return jsonResponse(serialized);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.update");
    const { id } = await context.params;

    const entry = await prisma.entry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new ApiError("NOT_FOUND", "Entry not found", 404);
    }

    assertEntryAccess(ctx, entry, "update");

    // Create version snapshot
    const maxVersion = await prisma.entryVersion.findFirst({
      where: { entryId: id },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    const nextVersion = (maxVersion?.version ?? 0) + 1;
    await prisma.entryVersion.create({
      data: {
        entryId: id,
        version: nextVersion,
        title: entry.title,
        slug: entry.slug,
        status: entry.status,
        fieldValues: entry.fieldValues,
        blocks: entry.blocks,
        metadata: entry.metadata,
        authorId: ctx.userId,
      },
    });

    const body = await req.json();
    const {
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
      taxonomyIds,
    } = body;

    if (blocks !== undefined && Array.isArray(blocks)) {
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

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (slug !== undefined) updateData.slug = slug;
    if (status !== undefined) updateData.status = status;
    if (fieldValues !== undefined) updateData.fieldValues = JSON.stringify(fieldValues);
    if (blocks !== undefined) updateData.blocks = JSON.stringify(blocks);
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata);
    if (authorId !== undefined) updateData.authorId = authorId;
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (parentId !== undefined) updateData.parentId = parentId || null;

    // Update taxonomy junction records
    if (taxonomyIds !== undefined) {
      await prisma.entryTaxonomyTerm.deleteMany({ where: { entryId: id } });
      if (Array.isArray(taxonomyIds) && taxonomyIds.length > 0) {
        await prisma.entryTaxonomyTerm.createMany({
          data: taxonomyIds.map((termId: string) => ({ entryId: id, termId })),
        });
      }
    }

    const updated = await prisma.entry.update({
      where: { id },
      data: updateData,
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
    });

    await logAudit("update", "entry", {
      userId: ctx.userId,
      entryId: id,
      fromStatus: entry.status,
      toStatus: updated.status,
      req,
    });

    const serialized = serializeEntry(updated);
    serialized.taxonomyTerms = updated.taxonomyLinks.map((link: any) => ({
      id: link.term.id,
      name: link.term.name,
      slug: link.term.slug,
      taxonomy: link.term.taxonomy,
    }));
    serialized.taxonomyIds = updated.taxonomyLinks.map((link: any) => link.termId);

    return jsonResponse(serialized);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.delete");
    const { id } = await context.params;

    const entry = await prisma.entry.findUnique({
      where: { id },
    });

    if (!entry) {
      throw new ApiError("NOT_FOUND", "Entry not found", 404);
    }

    assertEntryAccess(ctx, entry, "delete");

    await prisma.entry.delete({
      where: { id },
    });

    await logAudit("delete", "entry", { userId: ctx.userId, entryId: id, req });

    return jsonResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
