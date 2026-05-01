import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthAndPermission, ApiError } from "@/lib/api-utils";
import { jsonResponse, handleApiError, logAudit } from "@/lib/api-utils";

const VALID_BULK_ACTIONS = ["publish", "unpublish", "archive", "delete"];

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.update");
    const body = await req.json();
    const { ids, action } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError("INVALID_INPUT", "ids must be a non-empty array", 400);
    }
    if (!VALID_BULK_ACTIONS.includes(action)) {
      throw new ApiError("INVALID_INPUT", `Action must be one of: ${VALID_BULK_ACTIONS.join(", ")}`, 400);
    }

    if (action === "delete") {
      await requireAuthAndPermission(req, "content.delete");
    }

    const results = { succeeded: 0, failed: 0, errors: [] as string[] };

    for (const id of ids) {
      try {
        const entry = await prisma.entry.findUnique({ where: { id } });
        if (!entry) {
          results.failed++;
          results.errors.push(`Entry ${id} not found`);
          continue;
        }

        if (action === "publish") {
          if (entry.status === "published") {
            results.failed++;
            results.errors.push(`Entry ${id} is already published`);
            continue;
          }
          await prisma.entry.update({
            where: { id },
            data: { status: "published", publishedAt: new Date(), scheduledAt: null },
          });
          await logAudit("publish", "entry", {
            userId: ctx.userId,
            entryId: id,
            fromStatus: entry.status,
            toStatus: "published",
            req,
          });
        } else if (action === "unpublish") {
          if (entry.status !== "published") {
            results.failed++;
            results.errors.push(`Entry ${id} is not published`);
            continue;
          }
          await prisma.entry.update({
            where: { id },
            data: { status: "draft", publishedAt: null, scheduledAt: null },
          });
          await logAudit("unpublish", "entry", {
            userId: ctx.userId,
            entryId: id,
            fromStatus: entry.status,
            toStatus: "draft",
            req,
          });
        } else if (action === "archive") {
          if (entry.status === "archived") {
            results.failed++;
            results.errors.push(`Entry ${id} is already archived`);
            continue;
          }
          await prisma.entry.update({
            where: { id },
            data: { status: "archived", publishedAt: null, scheduledAt: null },
          });
          await logAudit("archive", "entry", {
            userId: ctx.userId,
            entryId: id,
            fromStatus: entry.status,
            toStatus: "archived",
            req,
          });
        } else if (action === "delete") {
          await prisma.entry.delete({ where: { id } });
          await logAudit("delete", "entry", { userId: ctx.userId, entryId: id, req });
        }

        results.succeeded++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Entry ${id}: ${err.message}`);
      }
    }

    return jsonResponse(results);
  } catch (err) {
    return handleApiError(err);
  }
}
