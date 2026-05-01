import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, parseQueryInt } from "@/lib/api-utils";

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

    const contentTypeId = searchParams.get("contentTypeId") || undefined;
    const search = searchParams.get("search") || undefined;
    const termIds = searchParams.getAll("termId").filter(Boolean);
    const termSlugs = searchParams.getAll("termSlug").filter(Boolean);
    const page = parseQueryInt(req, "page", 1);
    const limit = parseQueryInt(req, "limit", 20);
    const sortBy = searchParams.get("sortBy") || "publishedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const skip = (page - 1) * limit;

    const orderBy: Record<string, string> = {};
    if (["title", "createdAt", "updatedAt", "publishedAt"].includes(sortBy)) {
      orderBy[sortBy] = sortOrder === "asc" ? "asc" : "desc";
    } else {
      orderBy["publishedAt"] = "desc";
    }

    const where: any = { status: "published" };

    if (contentTypeId) {
      where.contentTypeId = contentTypeId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { fieldValues: { contains: search } },
      ];
    }

    if (termIds.length > 0 || termSlugs.length > 0) {
      where.taxonomyLinks = {
        some: {
          OR: [
            ...(termIds.length > 0 ? [{ termId: { in: termIds } }] : []),
            ...(termSlugs.length > 0 ? [{ term: { slug: { in: termSlugs } } }] : []),
          ],
        },
      };
    }

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
        orderBy,
        skip,
        take: limit,
      }),
      prisma.entry.count({ where }),
    ]);

    const data = entries.map(serializeEntry);

    return jsonResponse({
      items: data,
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
