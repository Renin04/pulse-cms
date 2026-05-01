import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuthAndPermission, ApiError, logAudit } from "@/lib/api-utils";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.archive");
    const { id } = params;

    const entry = await prisma.entry.findUnique({ where: { id } });
    if (!entry) {
      throw new ApiError("NOT_FOUND", "Entry not found", 404);
    }

    if (entry.status === "archived") {
      throw new ApiError("INVALID_STATE", "Entry is already archived", 400);
    }

    const previousStatus = entry.status;

    await prisma.entry.update({
      where: { id },
      data: { status: "archived", updatedAt: new Date() },
    });

    await logAudit("archive", "entry", {
      userId: ctx.userId,
      entryId: id,
      resourceId: id,
      fromStatus: previousStatus,
      toStatus: "archived",
      req,
    });

    return jsonResponse({ success: true, id, status: "archived" });
  } catch (err) {
    return handleApiError(err);
  }
}
