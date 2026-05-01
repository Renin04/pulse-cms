import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuthAndPermission, ApiError, logAudit } from "@/lib/api-utils";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.publish");
    const { id } = params;
    const body = await req.json();
    const { scheduledAt } = body;

    if (!scheduledAt) {
      throw new ApiError("INVALID_INPUT", "scheduledAt is required", 400);
    }

    const scheduleDate = new Date(scheduledAt);
    if (isNaN(scheduleDate.getTime()) || scheduleDate <= new Date()) {
      throw new ApiError("INVALID_INPUT", "scheduledAt must be a valid future date", 400);
    }

    const entry = await prisma.entry.findUnique({ where: { id } });
    if (!entry) {
      throw new ApiError("NOT_FOUND", "Entry not found", 404);
    }

    const previousStatus = entry.status;

    await prisma.entry.update({
      where: { id },
      data: { status: "scheduled", scheduledAt: scheduleDate, updatedAt: new Date() },
    });

    await prisma.publishJob.create({
      data: {
        entryId: id,
        action: "publish",
        scheduledAt: scheduleDate,
        createdBy: ctx.userId,
      },
    });

    await logAudit("schedule", "entry", {
      userId: ctx.userId,
      entryId: id,
      resourceId: id,
      fromStatus: previousStatus,
      toStatus: "scheduled",
      metadata: { scheduledAt },
      req,
    });

    return jsonResponse({ success: true, id, status: "scheduled", scheduledAt });
  } catch (err) {
    return handleApiError(err);
  }
}
