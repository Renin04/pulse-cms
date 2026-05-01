import { SignJWT, jwtVerify } from "jose";
import { compare, hash } from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pulse-local-dev-secret-change-in-production"
);
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || "pulse-local-refresh-secret-change-in-production"
);

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

export async function createRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setSubject(userId)
    .sign(JWT_REFRESH_SECRET);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
  return payload as unknown as TokenPayload;
}

export async function verifyRefreshToken(token: string): Promise<string> {
  const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET, { clockTolerance: 60 });
  if (!payload.sub) throw new Error("Invalid refresh token");
  return payload.sub;
}

export interface AuthContext {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export function hasPermission(ctx: AuthContext, scope: string): boolean {
  if (ctx.roles.includes("super_admin") || ctx.roles.includes("admin")) return true;
  return ctx.permissions.includes(scope);
}

export function requirePermission(ctx: AuthContext, scope: string): void {
  if (!hasPermission(ctx, scope)) {
    throw new Error(`Forbidden: missing permission '${scope}'`);
  }
}

export function requireAnyRole(ctx: AuthContext, roles: string[]): void {
  if (ctx.roles.includes("super_admin")) return;
  if (!roles.some((r) => ctx.roles.includes(r))) {
    throw new Error(`Forbidden: requires one of roles [${roles.join(", ")}]`);
  }
}
