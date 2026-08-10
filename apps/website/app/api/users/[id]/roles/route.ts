import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  jsonResponse,
  handleApiError,
  requireAuthAndPermission,
  ApiError,
  logAudit,
} from "@/lib/api-utils";
import { assertCanAssignRoles, assertCanModifyUser, assertNotRemovingLastSuperAdmin } from "@/lib/rbac";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await requireAuthAndPermission(req, "users.manage");
    const { id } = params;
    const body = await req.json();
    const { roleIds } = body;

    if (!Array.isArray(roleIds)) {
      throw new ApiError("INVALID_INPUT", "roleIds must be an array", 400);
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "User not found", 404);
    }

    // S1: only roles below the actor's own rank may be assigned — this is
    // what stops a users.manage holder from crowning themselves super_admin.
    await assertCanAssignRoles(ctx, roleIds);
    // S1: the target must rank below the actor (no re-roling peers/superiors).
    await assertCanModifyUser(ctx, id);
    // S7: never leave the system without a super_admin.
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

    const user = await prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });

    await logAudit("update_roles", "user", {
      userId: ctx.userId,
      resourceId: id,
      metadata: { roleIds },
      req,
    });

    return jsonResponse({
      id: user!.id,
      email: user!.email,
      displayName: user!.displayName,
      status: user!.status,
      roles: user!.userRoles.map((ur) => ur.role.name),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
