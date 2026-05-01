import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth(req);
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      return jsonResponse({ error: "User not found" }, 404);
    }

    return jsonResponse({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      roles: user.userRoles.map((ur) => ur.role.name),
      lastLoginAt: user.lastLoginAt,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
