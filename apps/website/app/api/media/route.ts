import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuthAndPermission, jsonResponse, handleApiError, parseQueryInt } from '@/lib/api-utils';

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  try {
    const _ctx = await requireAuthAndPermission(req, 'media.manage');

    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseQueryInt(req, 'page', 1);
    const limit = parseQueryInt(req, 'limit', 20);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: any = {};
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { filename: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          uploader: { select: { id: true, displayName: true, email: true } },
        },
      }),
      prisma.mediaAsset.count({ where }),
    ]);

    return jsonResponse({
      items: items.map((item) => ({
        ...item,
        metadata: safeJsonParse(item.metadata, {}),
      })),
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
