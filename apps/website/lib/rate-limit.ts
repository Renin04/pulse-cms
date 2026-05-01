/**
 * Rate Limiting
 *
 * In-memory rate limiter for single-instance deployments.
 * For multi-instance production, replace with Redis (ioredis/bullmq).
 */

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 min
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);

function getKey(identifier: string, prefix = 'rl'): string {
  return `${prefix}:${identifier}`;
}

function now(): number {
  return Date.now();
}

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  const key = getKey(identifier);
  const current = now();
  const entry = store.get(key);

  if (!entry || current > entry.resetAt) {
    // Window expired or first request
    const resetAt = current + WINDOW_MS;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.resetAt };
}

export function rateLimitHeaders(identifier: string): Record<string, string> {
  const { allowed, remaining, resetAt } = checkRateLimit(identifier);
  return {
    'X-RateLimit-Limit': String(MAX_REQUESTS),
    'X-RateLimit-Remaining': String(Math.max(0, remaining)),
    'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
    ...(allowed ? {} : { 'Retry-After': String(Math.ceil((resetAt - now()) / 1000)) }),
  };
}

// Simple cleanup to prevent memory leaks in long-running processes
setInterval(() => {
  const current = now();
  for (const [key, entry] of store.entries()) {
    if (current > entry.resetAt) {
      store.delete(key);
    }
  }
}, WINDOW_MS);
