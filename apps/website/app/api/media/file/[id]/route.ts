import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ApiError, handleApiError } from '@/lib/api-utils';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // The URL id may be the storage UUID (in the URL path) or the DB UUID.
    // Try matching by DB id, URL suffix (without query params), or filename prefix for robustness.
    const asset = await prisma.mediaAsset.findFirst({
      where: {
        OR: [
          { id },
          { url: { startsWith: `/api/media/file/${id}/` } },
          { filename: { startsWith: id } },
        ],
      },
    });
    if (!asset) {
      throw new ApiError('NOT_FOUND', 'Media asset not found', 404);
    }

    // For local storage, read the file from disk and serve it.
    // In production with S3, this route would redirect to the CDN URL.
    const config = {
      type: process.env.STORAGE_TYPE || 'local',
      localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
    };

    if (config.type === 's3') {
      // Redirect to public CDN URL
      return Response.redirect(asset.url, 302);
    }

    // Resolve local file path from metadata or fall back to scanning
    const localPath = path.resolve(config.localPath || './uploads');
    let filePath: string;

    const meta = JSON.parse(asset.metadata || '{}');
    if (meta.processedFilePath && typeof meta.processedFilePath === 'string' && existsSync(meta.processedFilePath)) {
      filePath = meta.processedFilePath;
    } else if (meta.filePath && typeof meta.filePath === 'string' && existsSync(meta.filePath)) {
      filePath = meta.filePath;
    } else {
      // Fallback: scan directory for file starting with id
      const subdir = id.slice(0, 2);
      const dir = path.join(localPath, subdir);
      const { readdir } = await import('fs/promises');
      const files = await readdir(dir).catch(() => []);
      const match = files.find((f) => f.startsWith(id));
      if (!match) {
        throw new ApiError('NOT_FOUND', 'File not found on disk', 404);
      }
      filePath = path.join(dir, match);
    }
    const buffer = await readFile(filePath);

    // Extract MIME from metadata or default to octet-stream
    let mimeType = 'application/octet-stream';
    try {
      const meta = JSON.parse(asset.metadata || '{}');
      if (meta.processedMimeType) mimeType = meta.processedMimeType;
      else if (meta.mimeType) mimeType = meta.mimeType;
    } catch {
      // ignore
    }

    const isDownload = req.nextUrl.searchParams.get('download') === '1';
    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'public, max-age=300, must-revalidate',
      'ETag': `"${id}-${buffer.length}"`,
    };
    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="${asset.filename || asset.name}"`;
    }

    return new Response(buffer, { status: 200, headers });
  } catch (err) {
    return handleApiError(err);
  }
}
