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

function serializeVersion(version: any) {
  if (!version) return version;
  return {
    ...version,
    fieldValues: safeJsonParse(version.fieldValues, {}),
    blocks: safeJsonParse(version.blocks, []),
    metadata: safeJsonParse(version.metadata, {}),
  };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireAuthAndPermission(req, "content.read");
    const { id } = await context.params;

    const entry = await prisma.entry.findUnique({ where: { id } });
    if (!entry) throw new ApiError("NOT_FOUND", "Entry not found", 404);

    const versions = await prisma.entryVersion.findMany({
      where: { entryId: id },
      orderBy: { version: "desc" },
      include: {
        author: { select: { id: true, displayName: true, email: true } },
      },
    });

    return jsonResponse(versions.map(serializeVersion));
  } catch (err) {
    return handleApiError(err);
  }
}
