/**
 * Global Middleware
 *
 * Production-ready middleware for:
 * - CORS headers on API routes
 * - Rate limiting on auth and sensitive endpoints
 * - Security headers reinforcement
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, headersFromResult } from '@/lib/rate-limit';
import { getCorsHeaders } from '@/lib/cors';

// Paths that require stricter rate limiting (auth endpoints)
const AUTH_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
];

// Paths that require write-rate limiting (CMS mutations)
const WRITE_PATHS = [
  '/api/cms/',
  '/api/media/upload',
  '/api/users',
  '/api/taxonomies/',
  '/api/settings',
];

function isWriteMethod(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

function clientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  // x-forwarded-for may be a "client, proxy1, proxy2" list — the real client is first
  return req.ip || forwarded?.split(',')[0].trim() || 'anonymous';
}

function applyRateLimit(req: NextRequest, bucket: string, maxRequests: number): NextResponse | null {
  // Per-tier bucket prefix: public reads, CMS writes and auth attempts must NOT
  // share one counter, or blog browsing burns the upload/mutation budget.
  const identifier = `${bucket}:${clientIdentifier(req)}`;
  const limit = checkRateLimit(identifier, maxRequests);
  const headers = headersFromResult(limit, maxRequests);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((limit.resetAt - Date.now()) / 1000),
        },
      },
      { status: 429, headers }
    );
  }

  // Continue with CORS headers and rate limit info
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  for (const [key, value] of Object.entries(getCorsHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Skip rate limiting in development to avoid false 429s from shared localhost IP
  if (process.env.NODE_ENV === 'development') {
    const response = NextResponse.next();
    for (const [key, value] of Object.entries(getCorsHeaders())) {
      response.headers.set(key, value);
    }
    return response;
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(),
    });
  }

  // Stricter rate limiting for auth endpoints (10 per 15 min)
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    const result = applyRateLimit(req, 'auth', 10);
    if (result) return result;
    return NextResponse.next();
  }

  // Rate limiting for CMS write operations (30 per 15 min)
  if (isWriteMethod(req.method) && WRITE_PATHS.some((p) => pathname.startsWith(p))) {
    const result = applyRateLimit(req, 'write', 30);
    if (result) return result;
    return NextResponse.next();
  }

  // General rate limiting for all other API routes (100 per 15 min)
  const result = applyRateLimit(req, 'api', 100);
  if (result) return result;
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
