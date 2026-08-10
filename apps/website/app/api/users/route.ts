import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { assertCanAssignRoles } from "@/lib/rbac";
import {
  jsonResponse,
  handleApiError,
  requireAuth,
  requireAuthAndPermission,
  ApiError,
  parseQueryInt,
  logAudit,
} from "@/lib/api-utils";

function serializeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
    roles: user.userRoles.map((ur: any) => ur.role.name),
  };
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);
    const search = req.nextUrl.searchParams.get("search") || "";
    const page = parseQueryInt(req, "page", 1);
    const limit = parseQueryInt(req, "limit", 20);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { displayName: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { userRoles: { include: { role: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    return jsonResponse({
      items: users.map(serializeUser),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuthAndPermission(req, "users.manage");
    const body = await req.json();
    const { email, password, displayName, status, roleIds } = body;

    if (!email) {
      throw new ApiError("INVALID_INPUT", "Email is required", 400);
    }

    // S5: a missing password used to store randomUUID(), creating accounts
    // that could never log in. Require an explicit, usable password.
    if (!password || typeof password !== "string" || password.length < 8) {
      throw new ApiError("INVALID_INPUT", "Password is required (min 8 characters)", 400);
    }

    // S1: the actor may only assign roles below their own rank.
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      await assertCanAssignRoles(ctx, roleIds);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ApiError("CONFLICT", "User with this email already exists", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: displayName || null,
        status: status || "active",
        userRoles:
          roleIds?.length > 0
            ? {
                create: [...new Set(roleIds as string[])].map((roleId) => ({
                  roleId,
                })),
              }
            : undefined,
      },
      include: { userRoles: { include: { role: true } } },
    });

    await logAudit("create", "user", {
      userId: ctx.userId,
      resourceId: user.id,
      metadata: { email, displayName, status, roleIds },
      req,
    });

    return jsonResponse(serializeUser(user), 201);
  } catch (err) {
    return handleApiError(err);
  }
}
