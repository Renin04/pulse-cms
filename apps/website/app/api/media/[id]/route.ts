import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuthAndPermission, ApiError, jsonResponse, handleApiError, logAudit } from '@/lib/api-utils';
import { hasPermission } from '@/lib/auth';
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
    const desiredQuality = mergedMetadata.desiredQuality as number | undefined;

    if (existing.type === 'image' && (desiredFormat || desiredQuality || desiredWidth || desiredHeight)) {
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

        // Format conversion / compression
        const formatMap: Record<string, keyof sharp.FormatEnum> = {
          webp: 'webp',
          jpeg: 'jpeg',
          jpg: 'jpeg',
          png: 'png',
        };

        const originalExt = path.extname(filePath).slice(1).toLowerCase();
        let targetFormat = formatMap[desiredFormat || ''];
        if (!targetFormat && desiredQuality != null) {
          // Compress in original format
          targetFormat = formatMap[originalExt];
        }

        if (targetFormat) {
          const quality = typeof desiredQuality === 'number' ? Math.max(1, Math.min(100, desiredQuality)) : 90;
          if (targetFormat === 'png') {
            // PNG: use palette-based quantization with quality for meaningful size reduction.
            // compressionLevel 9 for max zlib compression; effort 10 for best palette search.
            pipeline = pipeline.png({
              quality,
              compressionLevel: 9,
              effort: 10,
              palette: true,
            });
          } else {
            pipeline = pipeline.toFormat(targetFormat, { quality });
          }
          newMimeType = `image/${targetFormat}`;
        }

        const transformedBuffer = await pipeline.toBuffer();
        const ext = targetFormat || originalExt || 'bin';
        const baseName = (name || existing.name).replace(/\.[^/.]+$/, '');
        const newName = `${baseName}.${ext}`;

        // Save transformed file with a unique name to avoid race conditions
        const dir = path.dirname(filePath);
        const newFilePath = path.join(dir, `${path.basename(filePath, path.extname(filePath))}_processed_${Date.now()}.${ext}`);
        await writeFile(newFilePath, transformedBuffer);

        mergedMetadata.processedFilePath = newFilePath;
        mergedMetadata.processedMimeType = newMimeType;
        mergedMetadata.processedFileSize = transformedBuffer.length;
        newFilename = newName;
      }
    }

    // Capture old processed path before update so we can clean it up after
    const oldProcessedPath = safeJsonParse<Record<string, unknown>>(existing.metadata, {}).processedFilePath as string | undefined;

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

    // Clean up old processed file now that metadata points to the new one
    if (oldProcessedPath && oldProcessedPath !== mergedMetadata.processedFilePath && existsSync(oldProcessedPath)) {
      await unlink(oldProcessedPath).catch(() => {});
    }

    // Also remove any other orphaned processed files in the same directory
    const currentProcessedPath = mergedMetadata.processedFilePath as string | undefined;
    if (currentProcessedPath) {
      const procDir = path.dirname(currentProcessedPath);
      const procExt = path.extname(currentProcessedPath);
      try {
        const { readdir } = await import('fs/promises');
        const siblings = await readdir(procDir);
        for (const f of siblings) {
          if (f.includes('_processed_') && f.endsWith(procExt)) {
            const siblingPath = path.join(procDir, f);
            if (siblingPath !== currentProcessedPath && existsSync(siblingPath)) {
              await unlink(siblingPath).catch(() => {});
            }
          }
        }
      } catch { /* ignore cleanup errors */ }
    }

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

    // S8: media.manage alone must not let someone delete OTHER users' files
    // (DB record + on-disk file). Owners may delete their own uploads;
    // deleting others' requires an elevated scope.
    if (existing.uploaderId !== ctx.userId && !hasPermission(ctx, 'users.manage')) {
      throw new ApiError('FORBIDDEN', 'You can only delete your own uploads', 403);
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
