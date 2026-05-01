import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuthAndPermission, ApiError, logAudit } from "@/lib/api-utils";

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const terms = await prisma.taxonomyTerm.findMany({
      where: { taxonomyId: id },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    const parsed = terms.map((term) => ({
      ...term,
      metadata: term.metadata ? JSON.parse(term.metadata) : null,
    }));

    return jsonResponse(parsed);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  try {
    const ctx = await requireAuthAndPermission(req, "taxonomy.manage");
    const { id } = context.params;
    const body = await req.json();
    const { name, slug, description, color, parentId, order = 0, metadata } = body;

    if (!name || !slug) {
      throw new ApiError("INVALID_INPUT", "Name and slug are required", 400);
    }

    const taxonomy = await prisma.taxonomy.findUnique({ where: { id } });
    if (!taxonomy) {
      throw new ApiError("NOT_FOUND", "Taxonomy not found", 404);
    }

    const existing = await prisma.taxonomyTerm.findUnique({
      where: { taxonomyId_slug: { taxonomyId: id, slug } },
    });
    if (existing) {
      throw new ApiError("CONFLICT", "Term with this slug already exists in this taxonomy", 409);
    }

    if (parentId) {
      const parent = await prisma.taxonomyTerm.findFirst({
        where: { id: parentId, taxonomyId: id },
      });
      if (!parent) {
        throw new ApiError("INVALID_INPUT", "Parent term not found in this taxonomy", 400);
      }
    }

    const term = await prisma.taxonomyTerm.create({
      data: {
        taxonomyId: id,
        name,
        slug,
        description: description ?? null,
        color: color ?? null,
        parentId: parentId ?? null,
        order,
        metadata: typeof metadata === "object" && metadata !== null ? JSON.stringify(metadata) : null,
      },
    });

    await logAudit("create", "taxonomy_term", {
      userId: ctx.userId,
      resourceId: term.id,
      metadata: { taxonomyId: id },
      req,
    });

    return jsonResponse(
      {
        ...term,
        metadata: term.metadata ? JSON.parse(term.metadata) : null,
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}
