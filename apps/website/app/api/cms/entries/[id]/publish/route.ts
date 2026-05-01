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
    const ctx = await requireAuthAndPermission(req, "content.publish");
    const { id } = await context.params;

    const entry = await prisma.entry.findUnique({ where: { id } });
    if (!entry) throw new ApiError("NOT_FOUND", "Entry not found", 404);
    if (entry.status === "published") {
      throw new ApiError("INVALID_TRANSITION", "Entry is already published", 400);
    }

    const updated = await prisma.entry.update({
      where: { id },
      data: { status: "published", publishedAt: new Date(), scheduledAt: null },
      include: {
        contentType: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, displayName: true, email: true } },
      },
    });

    await logAudit("publish", "entry", {
      userId: ctx.userId,
      entryId: id,
      fromStatus: entry.status,
      toStatus: "published",
      req,
    });

    return jsonResponse(serializeEntry(updated));
  } catch (err) {
    return handleApiError(err);
  }
}
