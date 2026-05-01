import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, ApiError } from "@/lib/api-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const taxonomy = await prisma.taxonomy.findUnique({
      where: { slug },
      include: {
        terms: true,
      },
    });

    if (!taxonomy) {
      throw new ApiError("NOT_FOUND", "Taxonomy not found", 404);
    }

    const terms = await Promise.all(
      taxonomy.terms.map(async (term) => {
        const entryCount = await prisma.entryTaxonomyTerm.count({
          where: {
            termId: term.id,
            entry: { status: "published" },
          },
        });
        return {
          ...term,
          metadata: term.metadata ? JSON.parse(term.metadata) : null,
          entryCount,
        };
      })
    );

    return jsonResponse({
      ...taxonomy,
      config: taxonomy.config ? JSON.parse(taxonomy.config) : null,
      terms,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
