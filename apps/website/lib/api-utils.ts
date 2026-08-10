import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, AuthContext, requirePermission, ForbiddenError } from "./auth";
import { prisma } from "./db";

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data, meta: { timestamp: new Date().toISOString() } }, { status });
}

export function errorResponse(code: string, message: string, status = 500, details?: Record<string, string[]>) {
  return NextResponse.json(
    { error: { code, message, details, requestId: crypto.randomUUID(), timestamp: new Date().toISOString() } },
    { status }
  );
}

export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  try {
    const payload = await verifyAccessToken(token);
    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
      permissions: payload.permissions,
    };
  } catch {
    return null;
  }
}

export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const ctx = await getAuthContext(req);
  if (!ctx) {
    throw new ApiError("UNAUTHORIZED", "Authentication required", 401);
  }
  return ctx;
}

export async function requireAuthAndPermission(req: NextRequest, scope: string): Promise<AuthContext> {
  const ctx = await requireAuth(req);
  requirePermission(ctx, scope);
  return ctx;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 500,
    public details?: Record<string, string[]>
  ) {
    super(message);
  }
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return errorResponse(err.code, err.message, err.status, err.details);
  }
  if (err instanceof ForbiddenError) {
    return errorResponse("FORBIDDEN", err.message, 403);
  }
  // Never leak internals (Prisma messages, stack frames, SQL) to clients —
  // the full error stays server-side in the logs.
  console.error("[api] Unhandled error:", err);
  return errorResponse("INTERNAL_ERROR", "Internal server error", 500);
}

export function parseQueryInt(req: NextRequest, key: string, fallback: number): number {
  const val = req.nextUrl.searchParams.get(key);
  if (!val) return fallback;
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

export async function logAudit(
  action: string,
  resource: string,
  options: {
    userId?: string;
    entryId?: string;
    resourceId?: string;
    fromStatus?: string;
    toStatus?: string;
    metadata?: Record<string, unknown>;
    req?: NextRequest;
  } = {}
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        resource,
        userId: options.userId ?? null,
        entryId: options.entryId ?? null,
        resourceId: options.resourceId ?? null,
        fromStatus: options.fromStatus ?? null,
        toStatus: options.toStatus ?? null,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
        ipAddress: options.req?.headers.get("x-forwarded-for") || options.req?.ip || null,
        userAgent: options.req?.headers.get("user-agent") || null,
      },
    });
  } catch {
    // Fail silently — audit logging should not break user flows
  }
}
