import { NextRequest } from "next/server";
import { jsonResponse, handleApiError, getAuthContext, logAudit } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext(req);
    if (ctx) {
      await logAudit("logout", "user", { userId: ctx.userId, req });
    }
    return jsonResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
