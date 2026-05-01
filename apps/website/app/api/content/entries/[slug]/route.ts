import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, ApiError } from "@/lib/api-utils";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const entry = await prisma.entry.findFirst({
      where: { slug, status: "published" },
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
    });

    if (!entry) {
      throw new ApiError("NOT_FOUND", "Entry not found", 404);
    }

    return jsonResponse(serializeEntry(entry));
  } catch (err) {
    return handleApiError(err);
  }
}
