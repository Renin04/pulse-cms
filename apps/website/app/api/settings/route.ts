import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonResponse, handleApiError, requireAuthAndPermission, ApiError, logAudit } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");
    // Only allow public access to specific safe categories
    const publicCategories = ["site", "seo", "social", "branding"];
    const isPublic = category ? publicCategories.includes(category) : false;

    if (!isPublic) {
      await requireAuthAndPermission(req, "settings.manage");
    }

    const settings = await prisma.siteSetting.findMany({
      where: category ? { category } : isPublic ? { category: { in: publicCategories } } : undefined,
      orderBy: { key: "asc" },
    });

    const parsed = settings.map((s) => ({
      ...s,
      value: s.value ? JSON.parse(s.value) : null,
    }));

    return jsonResponse(parsed);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const ctx = await requireAuthAndPermission(req, "settings.manage");
    const body = await req.json();
    const { settings } = body;

    if (!Array.isArray(settings)) {
      throw new ApiError("INVALID_INPUT", "settings array is required", 400);
    }

    const results = [];
    for (const item of settings) {
      const { key, value, category, description } = item;
      if (!key || typeof value === "undefined") {
        throw new ApiError("INVALID_INPUT", "Each setting must have a key and value", 400);
      }

      const data = {
        value: JSON.stringify(value),
        category: category ?? "general",
        description: description ?? null,
      };

      const updated = await prisma.siteSetting.upsert({
        where: { key },
        update: data,
        create: { key, ...data },
      });

      results.push({
        ...updated,
        value: updated.value ? JSON.parse(updated.value) : null,
      });
    }

    await logAudit("update", "settings", {
      userId: ctx.userId,
      metadata: { count: settings.length },
      req,
    });

    return jsonResponse(results);
  } catch (err) {
    return handleApiError(err);
  }
}
