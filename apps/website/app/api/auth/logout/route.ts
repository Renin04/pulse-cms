import { NextRequest } from "next/server";
import { jsonResponse, handleApiError, getAuthContext, logAudit } from "@/lib/api-utils";
import { revokeRefreshToken } from "@/lib/refresh-tokens";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext(req);

    // Revoke the presented refresh token so logout is real: a stolen token
    // dies with the session instead of staying valid for its full TTL.
    // Body is optional — a client that lost its tokens still logs out cleanly.
    let refreshToken: string | null = null;
    try {
      const body = await req.json();
      if (body && typeof body.refreshToken === "string") refreshToken = body.refreshToken;
    } catch {
      // empty/invalid body — nothing to revoke
    }
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    if (ctx) {
      await logAudit("logout", "user", { userId: ctx.userId, req });
    }
    return jsonResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
