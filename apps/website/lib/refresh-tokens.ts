/**
 * Refresh Token Store
 *
 * Refresh tokens are persisted (as SHA-256 hashes) so they can be revoked on
 * rotation and logout. A presented token that is unknown, expired, or already
 * revoked is rejected — replaying a rotated token therefore fails closed.
 *
 * Single-instance friendly: the database is the only source of truth.
 */

import { createHash } from "crypto";
import { prisma } from "./db";

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function storeRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date
): Promise<void> {
  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashRefreshToken(token), expiresAt },
  });
}

/**
 * Returns the token record only if it exists, is not revoked, and is not
 * expired. Anything else (including a previously rotated token) returns null.
 */
export async function getActiveRefreshToken(token: string) {
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashRefreshToken(token) },
  });
  if (!record) return null;
  if (record.revokedAt) return null;
  if (record.expiresAt <= new Date()) return null;
  return record;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(token), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
