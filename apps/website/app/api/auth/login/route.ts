import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createAccessToken, createRefreshToken } from "@/lib/auth";
import { jsonResponse, handleApiError, ApiError, logAudit } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      throw new ApiError("INVALID_INPUT", "Email and password are required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
    });

    if (!user || user.status !== "active") {
      throw new ApiError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new ApiError("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(user.userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.scope)))
    );

    const accessToken = await createAccessToken({
      sub: user.id,
      email: user.email,
      roles,
      permissions,
    });
    const refreshToken = await createRefreshToken(user.id);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    await logAudit("login", "user", { userId: user.id, req });

    return jsonResponse({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        roles,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
