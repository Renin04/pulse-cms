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
  context: { params: Promise<{ id: string; versionId: string }> | { id: string; versionId: string } }
) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.update");
    const { id, versionId } = await context.params;

    const entry = await prisma.entry.findUnique({ where: { id } });
    if (!entry) throw new ApiError("NOT_FOUND", "Entry not found", 404);

    const version = await prisma.entryVersion.findUnique({
      where: { id: versionId },
    });
    if (!version || version.entryId !== id) {
      throw new ApiError("NOT_FOUND", "Version not found", 404);
    }

    // Snapshot current state before restoring
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

    const updated = await prisma.entry.update({
      where: { id },
      data: {
        title: version.title,
        slug: version.slug,
        status: version.status,
        fieldValues: version.fieldValues,
        blocks: version.blocks,
        metadata: version.metadata,
      },
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

    await logAudit("restore-version", "entry", {
      userId: ctx.userId,
      entryId: id,
      resourceId: versionId,
      req,
    });

    const serialized = serializeEntry(updated);
    serialized.taxonomyTerms = updated.taxonomyLinks.map((link: any) => ({
      id: link.term.id,
      name: link.term.name,
      slug: link.term.slug,
      taxonomy: link.term.taxonomy,
    }));

    return jsonResponse(serialized);
  } catch (err) {
    return handleApiError(err);
  }
}
