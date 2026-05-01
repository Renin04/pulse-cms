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
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // NOTE: In production, this token should be a signed JWT or cryptographically
    // secure token that is verified before returning draft content. For MVP,
    // we accept any string and try to resolve it to an entry by ID or slug,
    // returning the entry regardless of publication status.
    let entry = await prisma.entry.findUnique({
      where: { id: token },
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
      entry = await prisma.entry.findFirst({
        where: { slug: token },
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
    }

    if (!entry) {
      throw new ApiError("NOT_FOUND", "Entry not found", 404);
    }

    return jsonResponse(serializeEntry(entry));
  } catch (err) {
    return handleApiError(err);
  }
}
