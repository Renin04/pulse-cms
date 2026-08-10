import { SignJWT, jwtVerify } from "jose";
import { compare, hash } from "bcryptjs";

function getJwtSecret(name: string): Uint8Array {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
      `Set a strong random secret (e.g. openssl rand -base64 32)`
    );
  }
  return new TextEncoder().encode(value);
}

const JWT_SECRET = getJwtSecret("JWT_SECRET");
const JWT_REFRESH_SECRET = getJwtSecret("JWT_REFRESH_SECRET");

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return compare(password, hash);
}

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export async function createAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .setSubject(payload.sub)
    .sign(JWT_SECRET);
}

export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setSubject(userId)
    .setJti(crypto.randomUUID())
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
  return payload as unknown as TokenPayload;
}

export interface RefreshTokenPayload {
  userId: string;
  jti: string | null;
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET, { clockTolerance: 60 });
  if (!payload.sub) throw new Error("Invalid refresh token");
  return { userId: payload.sub, jti: payload.jti ?? null };
}

export interface AuthContext {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

/**
 * Thrown when an authenticated user lacks a required permission/role.
 * Mapped to a 403 response by handleApiError.
 */
export class ForbiddenError extends Error {}

export function hasPermission(ctx: AuthContext, scope: string): boolean {
  // Only super_admin bypasses permission checks. Every other role — including
  // one literally named "admin" — is evaluated strictly by its granted scopes.
  if (ctx.roles.includes("super_admin")) return true;
  return ctx.permissions.includes(scope);
}

export function requirePermission(ctx: AuthContext, scope: string): void {
  if (!hasPermission(ctx, scope)) {
    throw new ForbiddenError(`Forbidden: missing permission '${scope}'`);
  }
}

export function requireAnyRole(ctx: AuthContext, roles: string[]): void {
  if (ctx.roles.includes("super_admin")) return;
  if (!roles.some((r) => ctx.roles.includes(r))) {
    throw new ForbiddenError(`Forbidden: requires one of roles [${roles.join(", ")}]`);
  }
}

// Preview tokens — signed JWTs for temporary draft access
const PREVIEW_SECRET = getJwtSecret("JWT_SECRET");

export async function createPreviewToken(entryId: string): Promise<string> {
  return new SignJWT({ entryId, type: "preview" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(PREVIEW_SECRET);
}

export async function verifyPreviewToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, PREVIEW_SECRET, { clockTolerance: 60 });
  if (payload.type !== "preview" || !payload.entryId || typeof payload.entryId !== "string") {
    throw new Error("Invalid preview token");
  }
  return payload.entryId;
}
