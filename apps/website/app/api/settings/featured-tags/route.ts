import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuthAndPermission, ApiError, logAudit } from "@/lib/api-utils";

const FEATURED_TAGS_KEY = "featured-tags";

export async function GET(_req: NextRequest) {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: FEATURED_TAGS_KEY },
    });

    if (!setting) {
      return jsonResponse({ key: FEATURED_TAGS_KEY, value: [] });
    }

    return jsonResponse({
      key: setting.key,
      value: setting.value ? JSON.parse(setting.value) : [],
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await requireAuthAndPermission(req, "settings.manage");
    const body = await req.json();
    const { value } = body;

    if (!Array.isArray(value) || !value.every((v: unknown) => typeof v === "string")) {
      throw new ApiError("INVALID_INPUT", "Value must be an array of strings", 400);
    }

    const updated = await prisma.siteSetting.upsert({
      where: { key: FEATURED_TAGS_KEY },
      update: {
        value: JSON.stringify(value),
        category: "featured-tags",
      },
      create: {
        key: FEATURED_TAGS_KEY,
        value: JSON.stringify(value),
        category: "featured-tags",
        description: "Featured tags displayed on the site",
      },
    });

    await logAudit("update", "setting", {
      userId: ctx.userId,
      resourceId: updated.id,
      metadata: { key: FEATURED_TAGS_KEY },
      req,
    });

    return jsonResponse({
      key: updated.key,
      value: updated.value ? JSON.parse(updated.value) : [],
    });
  } catch (err) {
    return handleApiError(err);
  }
}
