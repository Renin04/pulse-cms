import { afterEach, describe, expect, it, vi } from "vitest";
import { checkRateLimit, headersFromResult, rateLimitHeaders } from "./rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

describe("checkRateLimit", () => {
  it("allows the first request with full quota minus one", () => {
    const res = checkRateLimit("t-first", 10);
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(9);
    expect(res.resetAt).toBeGreaterThan(Date.now());
  });

  it("counts down the remaining quota on each request", () => {
    expect(checkRateLimit("t-count", 3).remaining).toBe(2);
    expect(checkRateLimit("t-count", 3).remaining).toBe(1);
    expect(checkRateLimit("t-count", 3).remaining).toBe(0);
  });

  it("blocks once the limit is reached and keeps the original resetAt", () => {
    const first = checkRateLimit("t-block", 2);
    checkRateLimit("t-block", 2);
    const blocked = checkRateLimit("t-block", 2);

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetAt).toBe(first.resetAt);
  });

  it("uses the default limit of 100 when none is given", () => {
    const res = checkRateLimit("t-default");
    expect(res.allowed).toBe(true);
    expect(res.remaining).toBe(99);
  });

  it("starts a fresh window after the previous one expires", () => {
    vi.useFakeTimers();
    try {
      checkRateLimit("t-expire", 1);
      const blocked = checkRateLimit("t-expire", 1);
      expect(blocked.allowed).toBe(false);

      vi.advanceTimersByTime(15 * 60 * 1000 + 1);

      const fresh = checkRateLimit("t-expire", 1);
      expect(fresh.allowed).toBe(true);
      expect(fresh.remaining).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it("tracks different identifiers independently", () => {
    checkRateLimit("t-iso-a", 1);
    expect(checkRateLimit("t-iso-a", 1).allowed).toBe(false);
    expect(checkRateLimit("t-iso-b", 1).allowed).toBe(true);
  });
});

describe("rateLimitHeaders", () => {
  it("returns limit headers without Retry-After while allowed", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    try {
      const headers = rateLimitHeaders("t-hdr-ok", 5);
      expect(headers["X-RateLimit-Limit"]).toBe("5");
      expect(headers["X-RateLimit-Remaining"]).toBe("4");
      expect(headers["X-RateLimit-Reset"]).toBe(String(Math.ceil((Date.now() + 900000) / 1000)));
      expect(headers["Retry-After"]).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("includes Retry-After when the request is blocked", () => {
    vi.useFakeTimers();
    try {
      rateLimitHeaders("t-hdr-block", 1);
      const headers = rateLimitHeaders("t-hdr-block", 1);
      expect(headers["X-RateLimit-Remaining"]).toBe("0");
      expect(headers["Retry-After"]).toBe("900");
    } finally {
      vi.useRealTimers();
    }
  });

  it("clamps negative remaining to zero in the headers", () => {
    // A zero limit makes the first request's remaining -1.
    const headers = rateLimitHeaders("t-hdr-clamp", 0);
    expect(headers["X-RateLimit-Remaining"]).toBe("0");
  });
});

describe("headersFromResult", () => {
  it("builds headers from an existing result without consuming extra quota", () => {
    // Regression: middleware used to call checkRateLimit + rateLimitHeaders,
    // which checked AGAIN — every request burned two quota slots.
    const first = checkRateLimit("t-hfr", 3);
    const headers = headersFromResult(first, 3);
    expect(headers["X-RateLimit-Remaining"]).toBe("2");

    // A following raw check must see only ONE consumed slot, not two.
    const second = checkRateLimit("t-hfr", 3);
    expect(second.remaining).toBe(1);
  });

  it("includes Retry-After only for blocked results", () => {
    const blocked = { allowed: false, remaining: 0, resetAt: Date.now() + 60000 };
    const headers = headersFromResult(blocked, 1);
    expect(headers["Retry-After"]).toBeDefined();

    const allowed = { allowed: true, remaining: 4, resetAt: Date.now() + 60000 };
    expect(headersFromResult(allowed, 5)["Retry-After"]).toBeUndefined();
  });
});

describe("interval cleanup", () => {
  it("purges expired entries when the cleanup interval fires", async () => {
    vi.useFakeTimers();
    vi.resetModules();
    try {
      // Import under fake timers so the module-level setInterval is fake-controlled.
      const mod = await import("./rate-limit");
      mod.checkRateLimit("t-cleanup", 1);
      expect(mod.checkRateLimit("t-cleanup", 1).allowed).toBe(false);

      // Fire the cleanup interval twice: at 900000ms the entry is exactly at
      // its boundary (not yet purged), at 1800000ms it is gone.
      vi.advanceTimersByTime(2 * 15 * 60 * 1000 + 1);

      const fresh = mod.checkRateLimit("t-cleanup", 1);
      expect(fresh.allowed).toBe(true);
      expect(fresh.remaining).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
