import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuthAndPermission, ApiError, logAudit } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const _ctx = await requireAuthAndPermission(req, "content.read");
    const types = await prisma.contentType.findMany({ orderBy: { createdAt: "desc" } });
    return jsonResponse(
      types.map((t) => ({
        ...t,
        fields: JSON.parse(t.fields),
        metadata: t.metadata ? JSON.parse(t.metadata) : null,
      }))
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.create");
    const body = await req.json();
    const { name, slug, description, fields, metadata } = body;

    if (!name || !slug) {
      throw new ApiError("INVALID_INPUT", "Name and slug are required", 400);
    }

    const existing = await prisma.contentType.findUnique({ where: { slug } });
    if (existing) {
      throw new ApiError("CONFLICT", "Content type with this slug already exists", 409);
    }

    const type = await prisma.contentType.create({
      data: {
        name,
        slug,
        description: description || null,
        fields: JSON.stringify(fields || []),
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    await logAudit("create", "content_type", { userId: ctx.userId, resourceId: type.id, req });

    return jsonResponse({ ...type, fields: JSON.parse(type.fields), metadata: type.metadata ? JSON.parse(type.metadata) : null }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
