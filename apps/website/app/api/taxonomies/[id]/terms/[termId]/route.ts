import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuthAndPermission, ApiError, logAudit } from "@/lib/api-utils";

export async function GET(req: NextRequest, context: { params: { id: string; termId: string } }) {
  try {
    const { id, termId } = context.params;
    const term = await prisma.taxonomyTerm.findFirst({
      where: { id: termId, taxonomyId: id },
    });

    if (!term) {
      throw new ApiError("NOT_FOUND", "Term not found", 404);
    }

    return jsonResponse({
      ...term,
      metadata: term.metadata ? JSON.parse(term.metadata) : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, context: { params: { id: string; termId: string } }) {
  try {
    const ctx = await requireAuthAndPermission(req, "taxonomy.manage");
    const { id, termId } = context.params;
    const body = await req.json();
    const { name, slug, description, color, parentId, order, metadata } = body;

    const existing = await prisma.taxonomyTerm.findFirst({
      where: { id: termId, taxonomyId: id },
    });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Term not found", 404);
    }

    if (slug && slug !== existing.slug) {
      const slugTaken = await prisma.taxonomyTerm.findUnique({
        where: { taxonomyId_slug: { taxonomyId: id, slug } },
      });
      if (slugTaken) {
        throw new ApiError("CONFLICT", "Term with this slug already exists in this taxonomy", 409);
      }
    }

    if (parentId) {
      const parent = await prisma.taxonomyTerm.findFirst({
        where: { id: parentId, taxonomyId: id },
      });
      if (!parent) {
        throw new ApiError("INVALID_INPUT", "Parent term not found in this taxonomy", 400);
      }
      if (parentId === termId) {
        throw new ApiError("INVALID_INPUT", "Term cannot be its own parent", 400);
      }
    }

    const updated = await prisma.taxonomyTerm.update({
      where: { id: termId },
      data: {
        name: name ?? existing.name,
        slug: slug ?? existing.slug,
        description: description !== undefined ? description : existing.description,
        color: color !== undefined ? color : existing.color,
        parentId: parentId !== undefined ? parentId : existing.parentId,
        order: order !== undefined ? order : existing.order,
        metadata: typeof metadata === "object" && metadata !== null ? JSON.stringify(metadata) : existing.metadata,
      },
    });

    await logAudit("update", "taxonomy_term", {
      userId: ctx.userId,
      resourceId: termId,
      metadata: { taxonomyId: id },
      req,
    });

    return jsonResponse({
      ...updated,
      metadata: updated.metadata ? JSON.parse(updated.metadata) : null,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string; termId: string } }) {
  try {
    const ctx = await requireAuthAndPermission(req, "taxonomy.manage");
    const { id, termId } = context.params;

    const existing = await prisma.taxonomyTerm.findFirst({
      where: { id: termId, taxonomyId: id },
    });
    if (!existing) {
      throw new ApiError("NOT_FOUND", "Term not found", 404);
    }

    await prisma.taxonomyTerm.delete({ where: { id: termId } });

    await logAudit("delete", "taxonomy_term", {
      userId: ctx.userId,
      resourceId: termId,
      metadata: { taxonomyId: id },
      req,
    });

    return jsonResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
