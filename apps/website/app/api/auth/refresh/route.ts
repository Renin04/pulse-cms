import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyRefreshToken,
  createAccessToken,
  createRefreshToken,
  REFRESH_TOKEN_TTL_MS,
} from "@/lib/auth";
import { getActiveRefreshToken, revokeRefreshToken, storeRefreshToken } from "@/lib/refresh-tokens";
import { jsonResponse, handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      throw new ApiError("INVALID_INPUT", "Refresh token is required", 400);
    }

    // Signature/expiry check first, then the server-side store: a token that
    // was rotated or logged out is revoked there and must fail closed.
    let userId: string;
    try {
      ({ userId } = await verifyRefreshToken(refreshToken));
    } catch {
      throw new ApiError("UNAUTHORIZED", "Invalid refresh token", 401);
    }

    const stored = await getActiveRefreshToken(refreshToken);
    if (!stored || stored.userId !== userId) {
      throw new ApiError("UNAUTHORIZED", "Invalid refresh token", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, status: "active" },
      include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
    });

    if (!user) {
      throw new ApiError("UNAUTHORIZED", "Invalid refresh token", 401);
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.scope)))
    );

    // Rotate: the presented token dies here, its replacement is stored.
    await revokeRefreshToken(refreshToken);

    const newAccessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      roles,
      permissions,
    });
    const newRefreshToken = await createRefreshToken(user.id);
    await storeRefreshToken(user.id, newRefreshToken, new Date(Date.now() + REFRESH_TOKEN_TTL_MS));

    return jsonResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
