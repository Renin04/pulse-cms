import { NextRequest } from "next/server";
import { jsonResponse, handleApiError, requireAuthAndPermission } from "@/lib/api-utils";
import { createPreviewToken } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthAndPermission(req, "content.read");
    const { id } = await params;
    const token = await createPreviewToken(id);
    return jsonResponse({ token, url: `/blog/preview?token=${encodeURIComponent(token)}` });
  } catch (err) {
    return handleApiError(err);
  }
}
