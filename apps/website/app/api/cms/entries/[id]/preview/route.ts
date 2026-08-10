import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuthAndPermission, ApiError } from "@/lib/api-utils";
import { createPreviewToken } from "@/lib/auth";
import { assertEntryAccess } from "@/lib/entry-access";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuthAndPermission(req, "content.read");
    const { id } = await params;

    const entry = await prisma.entry.findUnique({ where: { id } });
    if (!entry) {
      throw new ApiError("NOT_FOUND", "Entry not found", 404);
    }

    // Preview tokens grant an hour of draft access — only editorial staff or
    // the entry's own author may mint one.
    assertEntryAccess(ctx, entry, "preview");

    const token = await createPreviewToken(id);
    return jsonResponse({ token, url: `/blog/preview?token=${encodeURIComponent(token)}` });
  } catch (err) {
    return handleApiError(err);
  }
}
