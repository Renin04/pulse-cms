import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuthAndPermission, ApiError, logAudit } from "@/lib/api-utils";

export async function GET(_req: NextRequest) {
  try {
    const taxonomies = await prisma.taxonomy.findMany({
      orderBy: { createdAt: "desc" },
      include: { terms: true },
    });
    return jsonResponse(taxonomies.map(t => ({
      ...t,
      config: JSON.parse(t.config || "{}"),
    })));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuthAndPermission(req, "taxonomy.manage");
    const body = await req.json();
    const { name, slug, type = "tag", description, config } = body;

    if (!name || !slug) {
      throw new ApiError("INVALID_INPUT", "Name and slug are required", 400);
    }

    const existing = await prisma.taxonomy.findUnique({ where: { slug } });
    if (existing) {
      throw new ApiError("CONFLICT", "Taxonomy with this slug already exists", 409);
    }

    const taxonomy = await prisma.taxonomy.create({
      data: {
        name,
        slug,
        type,
        description: description ?? null,
        config: typeof config === "object" && config !== null ? JSON.stringify(config) : "{}",
      },
    });

    // Auto-create a default term so the taxonomy is tickable in the studio
    await prisma.taxonomyTerm.create({
      data: {
        taxonomyId: taxonomy.id,
        name,
        slug,
        order: 0,
      },
    });

    await logAudit("create", "taxonomy", { userId: ctx.userId, resourceId: taxonomy.id, req });

    const created = await prisma.taxonomy.findUnique({
      where: { id: taxonomy.id },
      include: { terms: true },
    });

    return jsonResponse({ ...created, config: JSON.parse(created?.config || "{}") }, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
