import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { assertCanAssignRoles, assertCanModifyUser, assertNotRemovingLastSuperAdmin } from "@/lib/rbac";
import {
  jsonResponse,
  handleApiError,
  requireAuth,
  requireAuthAndPermission,
  ApiError,
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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req);
    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new ApiError("NOT_FOUND", "User not found", 404);
    }

    return jsonResponse(serializeUser(user));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuthAndPermission(req, "users.manage");
    const { id } = params;
    const body = await req.json();
    const { email, password, displayName, status, roleIds } = body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "User not found", 404);
    }

    // S1: the target must rank below the actor.
    await assertCanModifyUser(ctx, id);

    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        throw new ApiError("CONFLICT", "User with this email already exists", 409);
      }
    }

    if (roleIds !== undefined) {
      // S1: only roles below the actor's rank; S7: keep a last super_admin.
      await assertCanAssignRoles(ctx, roleIds);
      await assertNotRemovingLastSuperAdmin(id, roleIds);
      await prisma.userRole.deleteMany({ where: { userId: id } });
      if (roleIds.length > 0) {
        await prisma.userRole.createMany({
          data: [...new Set(roleIds as string[])].map((roleId) => ({
            userId: id,
            roleId,
          })),
        });
      }
    }

    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.passwordHash = await hashPassword(password);
    if (displayName !== undefined) updateData.displayName = displayName || null;
    if (status !== undefined) updateData.status = status;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { userRoles: { include: { role: true } } },
    });

    await logAudit("update", "user", {
      userId: ctx.userId,
      resourceId: id,
      metadata: { email, displayName, status, roleIds },
      req,
    });

    return jsonResponse(serializeUser(user));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuthAndPermission(req, "users.manage");
    const { id } = params;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "User not found", 404);
    }

    if (id === ctx.userId) {
      throw new ApiError("FORBIDDEN", "You cannot delete your own account", 403);
    }

    // S1: no deleting peers/superiors; S7: never delete the last super_admin.
    await assertCanModifyUser(ctx, id);
    await assertNotRemovingLastSuperAdmin(id, null);

    await prisma.user.delete({ where: { id } });

    await logAudit("delete", "user", {
      userId: ctx.userId,
      resourceId: id,
      metadata: { email: existing.email },
      req,
    });

    return jsonResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
