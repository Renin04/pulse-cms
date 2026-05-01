import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthAndPermission, ApiError } from "@/lib/api-utils";
import { jsonResponse, handleApiError } from "@/lib/api-utils";

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function serializeEntry(entry: any) {
  if (!entry) return entry;
  return {
    ...entry,
    fieldValues: safeJsonParse(entry.fieldValues, {}),
    blocks: safeJsonParse(entry.blocks, []),
    metadata: safeJsonParse(entry.metadata, {}),
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> | { slug: string } }
) {
  try {
    await requireAuthAndPermission(req, "content.read");
    const { slug } = await context.params;
    const contentTypeId = req.nextUrl.searchParams.get("contentTypeId") || undefined;

    const entry = await prisma.entry.findFirst({
      where: {
        slug,
        ...(contentTypeId ? { contentTypeId } : {}),
      },
      include: {
        contentType: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, displayName: true, email: true } },
        taxonomyLinks: {
          include: {
            term: {
              include: {
                taxonomy: { select: { id: true, name: true, slug: true } },
              },
            },
          },
        },
      },
    });

    if (!entry) {
      throw new ApiError("NOT_FOUND", "Entry not found", 404);
    }

    const serialized = serializeEntry(entry);
    serialized.taxonomyTerms = entry.taxonomyLinks.map((link: any) => ({
      id: link.term.id,
      name: link.term.name,
      slug: link.term.slug,
      taxonomy: link.term.taxonomy,
    }));

    return jsonResponse(serialized);
  } catch (err) {
    return handleApiError(err);
  }
}
