import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuthAndPermission, ApiError, logAudit } from "@/lib/api-utils";

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const taxonomy = await prisma.taxonomy.findUnique({
      where: { id },
      include: { terms: true },
    });

    if (!taxonomy) {
      throw new ApiError("NOT_FOUND", "Taxonomy not found", 404);
    }

    return jsonResponse({
      ...taxonomy,
      config: JSON.parse(taxonomy.config || "{}"),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  try {
    const ctx = await requireAuthAndPermission(req, "taxonomy.manage");
    const { id } = context.params;
    const body = await req.json();
    const { name, slug, type, description, config } = body;

    const existing = await prisma.taxonomy.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Taxonomy not found", 404);
    }

    if (slug && slug !== existing.slug) {
      const slugTaken = await prisma.taxonomy.findUnique({ where: { slug } });
      if (slugTaken) {
        throw new ApiError("CONFLICT", "Taxonomy with this slug already exists", 409);
      }
    }

    const updated = await prisma.taxonomy.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        slug: slug ?? existing.slug,
        type: type ?? existing.type,
        description: description !== undefined ? description : existing.description,
        config: typeof config === "object" && config !== null ? JSON.stringify(config) : existing.config,
      },
      include: { terms: true },
    });

    await logAudit("update", "taxonomy", { userId: ctx.userId, resourceId: id, req });

    return jsonResponse({
      ...updated,
      config: JSON.parse(updated.config || "{}"),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  try {
    const ctx = await requireAuthAndPermission(req, "taxonomy.manage");
    const { id } = context.params;

    const existing = await prisma.taxonomy.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Taxonomy not found", 404);
    }

    await prisma.taxonomy.delete({ where: { id } });

    await logAudit("delete", "taxonomy", { userId: ctx.userId, resourceId: id, req });

    return jsonResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
