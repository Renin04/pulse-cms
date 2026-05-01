import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuthAndPermission, ApiError, logAudit } from "@/lib/api-utils";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.publish");
    const { id } = params;

    const entry = await prisma.entry.findUnique({ where: { id } });
    if (!entry) {
      throw new ApiError("NOT_FOUND", "Entry not found", 404);
    }

    if (entry.status !== "published" && entry.status !== "scheduled") {
      throw new ApiError("INVALID_STATE", "Only published or scheduled entries can be unpublished", 400);
    }

    const previousStatus = entry.status;

    await prisma.entry.update({
      where: { id },
      data: { status: "draft", publishedAt: null, scheduledAt: null, updatedAt: new Date() },
    });

    await logAudit("unpublish", "entry", {
      userId: ctx.userId,
      entryId: id,
      resourceId: id,
      fromStatus: previousStatus,
      toStatus: "draft",
      req,
    });

    return jsonResponse({ success: true, id, status: "draft" });
  } catch (err) {
    return handleApiError(err);
  }
}
