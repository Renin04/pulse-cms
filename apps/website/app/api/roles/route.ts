import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const roles = await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const data = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.rolePermissions.map((rp) => rp.permission.scope),
    }));

    return jsonResponse(data);
  } catch (err) {
    return handleApiError(err);
  }
}
