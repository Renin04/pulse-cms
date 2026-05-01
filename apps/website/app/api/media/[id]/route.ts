import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuthAndPermission, ApiError, jsonResponse, handleApiError, logAudit } from '@/lib/api-utils';
import { createStorageAdapter } from '@/lib/media-storage';
import sharp from 'sharp';
import path from 'path';
import { writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuthAndPermission(req, 'media.manage');
    const { id } = params;

    const asset = await prisma.mediaAsset.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, displayName: true, email: true } },
        usages: {
          include: {
            entry: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    });

    if (!asset) {
      throw new ApiError('NOT_FOUND', 'Media asset not found', 404);
    }

    return jsonResponse({
      ...asset,
      metadata: safeJsonParse(asset.metadata, {}),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuthAndPermission(req, 'media.manage');
    const { id } = params;
    const body = await req.json();
    const { name, metadata } = body;

    const existing = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError('NOT_FOUND', 'Media asset not found', 404);
    }

    const mergedMetadata = {
      ...safeJsonParse(existing.metadata, {}),
      ...(metadata || {}),
    };

    let newFilename = existing.filename;
    let newMimeType = mergedMetadata.mimeType as string || 'application/octet-stream';

    // Image transformation
    const desiredFormat = mergedMetadata.desiredFormat as string | undefined;
    const desiredWidth = mergedMetadata.desiredWidth as number | undefined;
    const desiredHeight = mergedMetadata.desiredHeight as number | undefined;

    if (existing.type === 'image' && (desiredFormat || desiredWidth || desiredHeight)) {
      const adapter = createStorageAdapter();
      const meta = safeJsonParse<Record<string, unknown>>(existing.metadata, {});
      const filePath = meta.filePath as string;

      if (filePath) {
        const originalBuffer = await adapter.read(filePath);
        let pipeline = sharp(originalBuffer);

        // Resize
        if (desiredWidth || desiredHeight) {
          pipeline = pipeline.resize({
            width: desiredWidth || undefined,
            height: desiredHeight || undefined,
            fit: 'inside',
            withoutEnlargement: true,
          });
        }

        // Format conversion
        const formatMap: Record<string, keyof sharp.FormatEnum> = {
          webp: 'webp',
          jpeg: 'jpeg',
          jpg: 'jpeg',
          png: 'png',
        };

        const targetFormat = formatMap[desiredFormat || ''];
        if (targetFormat) {
          pipeline = pipeline.toFormat(targetFormat, { quality: 90 });
          newMimeType = `image/${targetFormat}`;
        }

        const transformedBuffer = await pipeline.toBuffer();
        const ext = targetFormat || path.extname(filePath).slice(1) || 'bin';
        const baseName = (name || existing.name).replace(/\.[^/.]+$/, '');
        const newName = `${baseName}.${ext}`;

        // Save transformed file next to original
        const dir = path.dirname(filePath);
        const newFilePath = path.join(dir, `${path.basename(filePath, path.extname(filePath))}_processed.${ext}`);
        await writeFile(newFilePath, transformedBuffer);

        // Delete old processed file if exists (not original, keep it safe)
        // Actually, let's just update to point to new file and clean up old one
        const oldMeta = safeJsonParse<Record<string, unknown>>(existing.metadata, {});
        const oldProcessedPath = oldMeta.processedFilePath as string;
        if (oldProcessedPath && oldProcessedPath !== filePath && existsSync(oldProcessedPath)) {
          await unlink(oldProcessedPath).catch(() => {});
        }

        mergedMetadata.processedFilePath = newFilePath;
        mergedMetadata.processedMimeType = newMimeType;
        mergedMetadata.processedFileSize = transformedBuffer.length;
        newFilename = newName;
      }
    }

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        filename: newFilename,
        metadata: JSON.stringify(mergedMetadata),
        updatedAt: new Date(),
      },
      include: {
        uploader: { select: { id: true, displayName: true, email: true } },
      },
    });

    await logAudit('update', 'media', { userId: ctx.userId, resourceId: id, req });

    return jsonResponse({
      ...updated,
      metadata: safeJsonParse(updated.metadata, {}),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await requireAuthAndPermission(req, 'media.manage');
    const { id } = params;

    const existing = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError('NOT_FOUND', 'Media asset not found', 404);
    }

    // Delete physical file if using local storage
    try {
      const meta = safeJsonParse(existing.metadata, {} as Record<string, unknown>);
      const filePath = typeof meta.filePath === 'string' ? meta.filePath : undefined;
      if (filePath) {
        const fs = await import('fs/promises');
        await fs.unlink(filePath);
      }
    } catch {
      // Ignore cleanup errors — DB record is the source of truth
    }

    await prisma.mediaAsset.delete({ where: { id } });
    await logAudit('delete', 'media', { userId: ctx.userId, resourceId: id, req });

    return jsonResponse({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
