import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuthAndPermission, ApiError, jsonResponse, handleApiError, logAudit } from '@/lib/api-utils';
import { createStorageAdapter, detectTypeFromMime } from '@/lib/media-storage';

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuthAndPermission(req, 'media.manage');

    const maxSize = parseInt(process.env.UPLOAD_MAX_SIZE || '10485760', 10); // 10MB
    const allowedTypes = (process.env.UPLOAD_ALLOWED_TYPES || 'image/*,video/*,audio/*,application/pdf')
      .split(',')
      .map((t) => t.trim().toLowerCase());

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ApiError('INVALID_INPUT', 'No file provided', 400);
    }

    // Validate size
    if (file.size > maxSize) {
      throw new ApiError('FILE_TOO_LARGE', `File exceeds maximum size of ${maxSize} bytes`, 413);
    }

    // Validate MIME type
    const isAllowed = allowedTypes.some((pattern) => {
      if (pattern.endsWith('/*')) {
        return file.type.startsWith(pattern.slice(0, -1));
      }
      return file.type === pattern;
    });

    if (!isAllowed) {
      throw new ApiError('INVALID_FILE_TYPE', `File type "${file.type}" is not allowed`, 415);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const adapter = createStorageAdapter();
    const result = await adapter.save({
      buffer,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    });

    const metadata: Record<string, unknown> = {
      mimeType: file.type,
      fileSize: file.size,
      originalName: file.name,
      filePath: result.path,
    };

    // Basic image dimensions extraction (PNG/JPEG/GIF/WebP)
    if (file.type.startsWith('image/')) {
      const dims = extractImageDimensions(buffer);
      if (dims) {
        result.width = dims.width;
        result.height = dims.height;
        metadata.width = dims.width;
        metadata.height = dims.height;
      }
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        name: file.name,
        filename: `${result.id}_${file.name}`,
        url: result.url,
        type: detectTypeFromMime(file.type),
        metadata: JSON.stringify(metadata),
        uploaderId: ctx.userId,
      },
    });

    await logAudit('upload', 'media', { userId: ctx.userId, resourceId: asset.id, req });

    return jsonResponse(
      {
        id: asset.id,
        name: asset.name,
        url: asset.url,
        type: asset.type,
        size: file.size,
        mimeType: file.type,
        width: result.width,
        height: result.height,
        createdAt: asset.createdAt,
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}

function extractImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  try {
    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }
    // JPEG
    if (buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset < buffer.length) {
        if (buffer[offset] !== 0xff) break;
        const marker = buffer[offset + 1];
        if (marker === 0xd9 || marker === 0xda) break;
        if (marker === 0xc0 || marker === 0xc2) {
          return {
            height: buffer.readUInt16BE(offset + 5),
            width: buffer.readUInt16BE(offset + 7),
          };
        }
        const length = buffer.readUInt16BE(offset + 2);
        offset += 2 + length;
      }
    }
    // GIF
    if (buffer.slice(0, 3).toString() === 'GIF') {
      return {
        width: buffer.readUInt16LE(6),
        height: buffer.readUInt16LE(8),
      };
    }
    // WebP
    if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') {
      const chunkStart = 12;
      const chunkType = buffer.slice(chunkStart, chunkStart + 4).toString();
      if (chunkType === 'VP8 ' && buffer[chunkStart + 9] === 0x9d && buffer[chunkStart + 10] === 0x01 && buffer[chunkStart + 11] === 0x2a) {
        return {
          width: buffer.readUInt16LE(chunkStart + 14) & 0x3fff,
          height: buffer.readUInt16LE(chunkStart + 16) & 0x3fff,
        };
      }
      if (chunkType === 'VP8X') {
        return {
          width: buffer.readUIntLE(chunkStart + 24, 3) + 1,
          height: buffer.readUIntLE(chunkStart + 27, 3) + 1,
        };
      }
    }
  } catch {
    // ignore extraction errors
  }
  return null;
}
