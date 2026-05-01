/**
 * Media Storage Adapter
 *
 * Abstracts file storage for production flexibility.
 * Supports: local filesystem (dev) and S3-compatible (production).
 *
 * For S3/R2/Cloudflare: install @aws-sdk/client-s3 and @aws-sdk/lib-storage,
 * then uncomment the S3 adapter code below.
 */

import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export interface StorageConfig {
  type: 'local' | 's3';
  localPath?: string;
  publicUrl?: string;
  s3Endpoint?: string;
  s3Region?: string;
  s3Bucket?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
}

export interface UploadedFile {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface StorageResult {
  id: string;
  url: string;
  path: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

function getConfig(): StorageConfig {
  return {
    type: (process.env.STORAGE_TYPE as 'local' | 's3') || 'local',
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
    publicUrl: process.env.STORAGE_PUBLIC_URL || '/api/media/file',
    s3Endpoint: process.env.S3_ENDPOINT,
    s3Region: process.env.S3_REGION,
    s3Bucket: process.env.S3_BUCKET,
    s3AccessKey: process.env.S3_ACCESS_KEY,
    s3SecretKey: process.env.S3_SECRET_KEY,
  };
}

function sanitizeFilename(name: string): string {
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
  return `${base}-${Date.now()}${ext}`;
}

function detectTypeFromMime(mime: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf' || mime.includes('document') || mime.includes('msword') || mime.includes('officedocument')) return 'document';
  return 'other';
}

export { detectTypeFromMime };

// ============================================================================
// Local Storage Adapter
// ============================================================================

class LocalStorageAdapter {
  private basePath: string;
  private publicUrl: string;

  constructor(config: StorageConfig) {
    this.basePath = path.resolve(config.localPath || './uploads');
    this.publicUrl = (config.publicUrl || '/api/media/file').replace(/\/$/, '');
  }

  async save(file: UploadedFile): Promise<StorageResult> {
    const id = randomUUID();
    const sanitized = sanitizeFilename(file.originalName);
    const subdir = id.slice(0, 2);
    const dir = path.join(this.basePath, subdir);

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    const filePath = path.join(dir, `${id}_${sanitized}`);
    await writeFile(filePath, file.buffer);

    return {
      id,
      url: `${this.publicUrl}/${id}/`,
      path: filePath,
      size: file.size,
      mimeType: file.mimeType,
    };
  }

  async delete(filePath: string): Promise<void> {
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  }

  async read(filePath: string): Promise<Buffer> {
    return readFile(filePath);
  }
}

// ============================================================================
// S3 Storage Adapter (Stub — uncomment when @aws-sdk is installed)
// ============================================================================

// class S3StorageAdapter {
//   private client: S3Client;
//   private bucket: string;
//   private publicUrl: string;
//
//   constructor(config: StorageConfig) {
//     this.client = new S3Client({
//       endpoint: config.s3Endpoint,
//       region: config.s3Region || 'auto',
//       credentials: {
//         accessKeyId: config.s3AccessKey || '',
//         secretAccessKey: config.s3SecretKey || '',
//       },
//       forcePathStyle: !!config.s3Endpoint?.includes('localhost'),
//     });
//     this.bucket = config.s3Bucket || 'pulse-media';
//     this.publicUrl = config.publicUrl || config.s3Endpoint || '';
//   }
//
//   async save(file: UploadedFile): Promise<StorageResult> {
//     const id = randomUUID();
//     const key = `media/${id.slice(0, 2)}/${id}_${sanitizeFilename(file.originalName)}`;
//
//     await this.client.send(
//       new PutObjectCommand({
//         Bucket: this.bucket,
//         Key: key,
//         Body: file.buffer,
//         ContentType: file.mimeType,
//       })
//     );
//
//     return {
//       id,
//       url: `${this.publicUrl}/${key}`,
//       path: key,
//       size: file.size,
//       mimeType: file.mimeType,
//     };
//   }
//
//   async delete(key: string): Promise<void> {
//     await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
//   }
//
//   async read(key: string): Promise<Buffer> {
//     const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
//     return Buffer.from(await res.Body?.transformToByteArray() || []);
//   }
// }

// ============================================================================
// Factory
// ============================================================================

export function createStorageAdapter(): LocalStorageAdapter {
  const config = getConfig();
  if (config.type === 's3') {
    // return new S3StorageAdapter(config);
    throw new Error('S3 storage requires @aws-sdk/client-s3. Install it or set STORAGE_TYPE=local');
  }
  return new LocalStorageAdapter(config);
}
