/**
 * Role-Based Access Control — rank guards
 *
 * Every role has a `rank` (higher = more powerful; super_admin is highest).
 * The central rule: a user may only assign roles BELOW their own rank, and may
 * only modify (update / delete / re-role) users whose rank is BELOW their own.
 * This blocks privilege escalation such as a users.manage holder creating or
 * crowning super_admins.
 *
 * Also home to the last-super-admin guard and the role-in-use guard.
 */

import { prisma } from "./db";
import { AuthContext } from "./auth";
import { ApiError } from "./api-utils";

export const SUPER_ADMIN_ROLE = "super_admin";

/** Highest rank among the given role names (unknown roles count as 0). */
export async function getRankForRoleNames(names: string[]): Promise<number> {
  if (names.length === 0) return 0;
  const roles = await prisma.role.findMany({
    where: { name: { in: names } },
    select: { rank: true },
  });
  return roles.reduce((max, role) => Math.max(max, role.rank), 0);
}

/** Highest rank the authenticated actor holds. */
export async function getActorRank(ctx: AuthContext): Promise<number> {
  return getRankForRoleNames(ctx.roles);
}

/** Highest rank a target user holds. */
export async function getUserRank(userId: string): Promise<number> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: { select: { rank: true } } },
  });
  return userRoles.reduce((max, ur) => Math.max(max, ur.role.rank), 0);
}

/** Throws 403 unless every given role ranks strictly below the actor. */
export async function assertCanAssignRoles(
  ctx: AuthContext,
  roleIds: string[]
): Promise<void> {
  const uniqueIds = [...new Set(roleIds)];
  if (uniqueIds.length === 0) return;
  const actorRank = await getActorRank(ctx);
  const roles = await prisma.role.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true, name: true, rank: true },
  });
  for (const role of roles) {
    if (role.rank >= actorRank) {
      throw new ApiError(
        "FORBIDDEN",
        `You cannot assign the role '${role.name}' — it is not below your own rank`,
        403
      );
    }
  }
}

/**
 * Throws 403 if the target user ranks at or above the actor.
 * Callers must still 404 unknown users BEFORE calling this.
 */
export async function assertCanModifyUser(
  ctx: AuthContext,
  targetUserId: string
): Promise<void> {
  const [actorRank, targetRank] = await Promise.all([
    getActorRank(ctx),
    getUserRank(targetUserId),
  ]);
  if (targetRank >= actorRank) {
    throw new ApiError(
      "FORBIDDEN",
      "You cannot modify a user at or above your own rank",
      403
    );
  }
}

/**
 * Last-super-admin guard. `newRoleIds` is the role set the target will have
 * after the operation, or null when the target is being deleted entirely.
 * Throws 409 when the operation would leave the system without a super_admin.
 */
export async function assertNotRemovingLastSuperAdmin(
  targetUserId: string,
  newRoleIds: string[] | null
): Promise<void> {
  const superAdminRole = await prisma.role.findUnique({
    where: { name: SUPER_ADMIN_ROLE },
    select: { id: true },
  });
  if (!superAdminRole) return;

  const membership = await prisma.userRole.findFirst({
    where: { userId: targetUserId, roleId: superAdminRole.id },
  });
  if (!membership) return; // target is not a super_admin — nothing to protect

  if (newRoleIds !== null && newRoleIds.includes(superAdminRole.id)) {
    return; // target keeps the super_admin role
  }

  const superAdminCount = await prisma.userRole.count({
    where: { roleId: superAdminRole.id },
  });
  if (superAdminCount <= 1) {
    throw new ApiError(
      "CONFLICT",
      "Cannot remove the last super_admin — promote another user first",
      409
    );
  }
}

/**
 * Role-in-use guard: roles that still have users must not be deleted.
 * NOTE: the REST surface currently exposes no role-delete endpoint; this guard
 * is exported for the admin role-management flow that adds one.
 */
export async function assertRoleNotInUse(roleId: string): Promise<void> {
  const userCount = await prisma.userRole.count({ where: { roleId } });
  if (userCount > 0) {
    throw new ApiError(
      "CONFLICT",
      `Role cannot be deleted — it is still assigned to ${userCount} user(s)`,
      409
    );
  }
}
