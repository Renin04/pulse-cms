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

export function checkRateLimit(identifier: string, maxRequests = MAX_REQUESTS): {
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
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Build rate-limit headers from an ALREADY-COMPUTED check result.
 * Never calls checkRateLimit itself — pairing this with a check avoids
 * the double-count bug where every request consumed two quota slots.
 */
export function headersFromResult(
  result: { allowed: boolean; remaining: number; resetAt: number },
  maxRequests = MAX_REQUESTS
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(maxRequests),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    ...(result.allowed ? {} : { 'Retry-After': String(Math.ceil((result.resetAt - now()) / 1000)) }),
  };
}

/**
 * Convenience: check the limit AND emit headers in one call.
 * NOTE: consumes one quota slot — do not pair with a separate checkRateLimit call.
 */
export function rateLimitHeaders(identifier: string, maxRequests = MAX_REQUESTS): Record<string, string> {
  return headersFromResult(checkRateLimit(identifier, maxRequests), maxRequests);
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
