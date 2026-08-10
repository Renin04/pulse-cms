import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, ApiError } from "@/lib/api-utils";
import { requirePermission } from "@/lib/auth";
import { jsonResponse, handleApiError, logAudit } from "@/lib/api-utils";

// Each bulk action is gated on the SAME scope the equivalent single-entry
// route requires — checked up front, before any entry is touched.
const BULK_ACTION_SCOPES: Record<string, string> = {
  publish: "content.publish",
  unpublish: "content.publish",
  archive: "content.archive",
  delete: "content.delete",
};

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const body = await req.json();
    const { ids, action } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ApiError("INVALID_INPUT", "ids must be a non-empty array", 400);
    }
    const scope = BULK_ACTION_SCOPES[action];
    if (!scope) {
      throw new ApiError("INVALID_INPUT", `Action must be one of: ${Object.keys(BULK_ACTION_SCOPES).join(", ")}`, 400);
    }

    requirePermission(ctx, scope);

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
