import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuthAndPermission, ApiError, logAudit } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthAndPermission(req, "content.read");
    const { id } = params;
    const type = await prisma.contentType.findUnique({ where: { id } });
    if (!type) {
      throw new ApiError("NOT_FOUND", "Content type not found", 404);
    }
    return jsonResponse({
      ...type,
      fields: JSON.parse(type.fields),
      metadata: type.metadata ? JSON.parse(type.metadata) : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.update");
    const { id } = params;
    const body = await req.json();
    const { name, description, fields, metadata } = body;

    const existing = await prisma.contentType.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Content type not found", 404);
    }

    const updated = await prisma.contentType.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        description: description !== undefined ? description : existing.description,
        fields: fields !== undefined ? JSON.stringify(fields) : existing.fields,
        metadata: metadata !== undefined ? JSON.stringify(metadata) : existing.metadata,
        updatedAt: new Date(),
      },
    });

    await logAudit("update", "content_type", { userId: ctx.userId, resourceId: id, req });

    return jsonResponse({
      ...updated,
      fields: JSON.parse(updated.fields),
      metadata: updated.metadata ? JSON.parse(updated.metadata) : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.delete");
    const { id } = params;

    const existing = await prisma.contentType.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Content type not found", 404);
    }

    const entryCount = await prisma.entry.count({ where: { contentTypeId: id } });
    if (entryCount > 0) {
      throw new ApiError("CONFLICT", `Cannot delete content type with ${entryCount} existing entries`, 409);
    }

    await prisma.contentType.delete({ where: { id } });
    await logAudit("delete", "content_type", { userId: ctx.userId, resourceId: id, req });

    return jsonResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
