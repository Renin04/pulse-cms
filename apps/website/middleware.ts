/**
 * Global Middleware
 *
 * Production-ready middleware for:
 * - CORS headers on API routes
 * - Rate limiting on auth and sensitive endpoints
 * - Security headers reinforcement
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rate-limit';
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

function applyRateLimit(req: NextRequest, maxRequests: number): NextResponse | null {
  const identifier = req.ip || req.headers.get('x-forwarded-for') || 'anonymous';
  const limit = checkRateLimit(identifier, maxRequests);
  const headers = rateLimitHeaders(identifier, maxRequests);

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
    const result = applyRateLimit(req, 10);
    if (result) return result;
    return NextResponse.next();
  }

  // Rate limiting for CMS write operations (30 per 15 min)
  if (isWriteMethod(req.method) && WRITE_PATHS.some((p) => pathname.startsWith(p))) {
    const result = applyRateLimit(req, 30);
    if (result) return result;
    return NextResponse.next();
  }

  // General rate limiting for all other API routes (100 per 15 min)
  const result = applyRateLimit(req, 100);
  if (result) return result;
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
