import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, parseQueryInt, ApiError } from "@/lib/api-utils";

function serializeEntry(entry: any) {
  const { taxonomyLinks, ...rest } = entry;
  return {
    ...rest,
    fieldValues: entry.fieldValues ? JSON.parse(entry.fieldValues) : null,
    blocks: entry.blocks ? JSON.parse(entry.blocks) : null,
    metadata: entry.metadata ? JSON.parse(entry.metadata) : null,
    taxonomyTerms: taxonomyLinks?.map((link: any) => ({
      id: link.term.id,
      name: link.term.name,
      slug: link.term.slug,
      taxonomyId: link.term.taxonomyId,
      taxonomyName: link.term.taxonomy.name,
    })) ?? [],
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q") || "";
    const page = parseQueryInt(req, "page", 1);
    const limit = parseQueryInt(req, "limit", 20);
    const skip = (page - 1) * limit;

    if (!q.trim()) {
      throw new ApiError("VALIDATION_ERROR", "Query parameter 'q' is required", 400);
    }

    const where = {
      status: "published" as const,
      OR: [
        { title: { contains: q } },
        { fieldValues: { contains: q } },
      ],
    };

    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        include: {
          contentType: true,
          author: { select: { id: true, displayName: true, email: true } },
          taxonomyLinks: {
            include: {
              term: {
                include: { taxonomy: true },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { publishedAt: "desc" },
      }),
      prisma.entry.count({ where }),
    ]);

    return jsonResponse({
      items: entries.map(serializeEntry),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
