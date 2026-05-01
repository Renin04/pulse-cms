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

// Paths that require stricter rate limiting
const SENSITIVE_PATHS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(),
    });
  }

  // Rate limiting for sensitive paths
  if (SENSITIVE_PATHS.some((p) => pathname.startsWith(p))) {
    const identifier = req.ip || req.headers.get('x-forwarded-for') || 'anonymous';
    const limit = checkRateLimit(identifier);
    const headers = rateLimitHeaders(identifier);

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

  // Apply CORS to all API routes
  const response = NextResponse.next();
  for (const [key, value] of Object.entries(getCorsHeaders())) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
