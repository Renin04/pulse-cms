import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, createAccessToken, createRefreshToken, REFRESH_TOKEN_TTL_MS } from "@/lib/auth";
import { storeRefreshToken } from "@/lib/refresh-tokens";
import { jsonResponse, handleApiError, ApiError, logAudit } from "@/lib/api-utils";
import { checkRateLimit, headersFromResult } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

// Brute-force guard: 10 attempts per 15 min per IP (in-memory; single instance).
const LOGIN_MAX_ATTEMPTS = 10;

export async function POST(req: NextRequest) {
  try {
    const identifier = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "anonymous";
    const limit = checkRateLimit(`login:${identifier}`, LOGIN_MAX_ATTEMPTS);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many login attempts. Try again later.",
            retryAfter: Math.ceil((limit.resetAt - Date.now()) / 1000),
          },
        },
        { status: 429, headers: headersFromResult(limit, LOGIN_MAX_ATTEMPTS) }
      );
    }

    let body: { email?: unknown; password?: unknown };
    try {
      body = await req.json();
    } catch {
      throw new ApiError("INVALID_INPUT", "Request body must be valid JSON", 400);
    }
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
    await storeRefreshToken(user.id, refreshToken, new Date(Date.now() + REFRESH_TOKEN_TTL_MS));

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
