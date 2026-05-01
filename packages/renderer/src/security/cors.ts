/**
 * CORS (Cross-Origin Resource Sharing) utilities for Pulse renderer.
 * Handles safe cross-origin requests for embedded content, API calls, and plugins.
 */

/**
 * CORS policy configuration for a resource or API endpoint.
 */
export interface CorsPolicy {
  /** Allowed origins. Use "*" for public resources (not recommended for sensitive APIs). */
  allowedOrigins: string[] | "*";
  /** Allowed HTTP methods. */
  allowedMethods?: string[];
  /** Allowed request headers. */
  allowedHeaders?: string[];
  /** Whether to allow credentials (cookies, auth headers). */
  allowCredentials?: boolean;
  /** Max age for preflight cache (in seconds). */
  maxAge?: number;
}

/**
 * Default CORS policy for public Pulse content.
 * Allows GET requests from any origin without credentials.
 */
export const DEFAULT_PUBLIC_CORS_POLICY: CorsPolicy = {
  allowedOrigins: "*",
  allowedMethods: ["GET", "HEAD", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
  allowCredentials: false,
  maxAge: 86400, // 24 hours
};

/**
 * Strict CORS policy for authenticated APIs.
 * Requires explicit origin allowlist and supports credentials.
 */
export function createStrictCorsPolicy(allowedOrigins: string[]): CorsPolicy {
  return {
    allowedOrigins,
    allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    allowCredentials: true,
    maxAge: 3600, // 1 hour
  };
}

/**
 * Check if an origin is allowed by a CORS policy.
 */
export function isOriginAllowed(origin: string, policy: CorsPolicy): boolean {
  if (policy.allowedOrigins === "*") return true;
  return policy.allowedOrigins.includes(origin);
}

/**
 * Generate CORS response headers for a given request origin and policy.
 * Returns a record of header names to values.
 */
export function generateCorsHeaders(
  requestOrigin: string,
  policy: CorsPolicy,
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (!isOriginAllowed(requestOrigin, policy)) {
    return headers; // No CORS headers if origin is not allowed
  }

  if (policy.allowedOrigins === "*") {
    headers["Access-Control-Allow-Origin"] = "*";
  } else {
    headers["Access-Control-Allow-Origin"] = requestOrigin;
  }

  if (policy.allowCredentials) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }

  if (policy.allowedMethods && policy.allowedMethods.length > 0) {
    headers["Access-Control-Allow-Methods"] = policy.allowedMethods.join(", ");
  }

  if (policy.allowedHeaders && policy.allowedHeaders.length > 0) {
    headers["Access-Control-Allow-Headers"] = policy.allowedHeaders.join(", ");
  }

  if (policy.maxAge !== undefined) {
    headers["Access-Control-Max-Age"] = String(policy.maxAge);
  }

  return headers;
}

/**
 * Validate a CORS preflight request.
 * Returns true if the request should be allowed, false otherwise.
 */
export function validatePreflightRequest(
  requestOrigin: string,
  requestMethod: string,
  requestHeaders: string[],
  policy: CorsPolicy,
): boolean {
  if (!isOriginAllowed(requestOrigin, policy)) return false;

  if (policy.allowedMethods && !policy.allowedMethods.includes(requestMethod)) {
    return false;
  }

  if (policy.allowedHeaders) {
    const allowedHeadersLower = policy.allowedHeaders.map((h) => h.toLowerCase());
    for (const header of requestHeaders) {
      if (!allowedHeadersLower.includes(header.toLowerCase())) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Client-side fetch wrapper with CORS error handling.
 * Provides better error messages for common CORS issues.
 */
export async function corsAwareFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      throw new Error(
        `CORS error: Unable to fetch ${url}. The server may not allow cross-origin requests from this domain.`,
      );
    }
    throw error;
  }
}

/**
 * Check if a URL is same-origin with the current page.
 * Returns true if origins match, false otherwise.
 * Safe to call in both browser and Node environments.
 */
export function isSameOrigin(url: string): boolean {
  if (typeof window === "undefined") return false; // SSR context

  try {
    const urlObj = new URL(url, window.location.href);
    return urlObj.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Sanitize a URL to prevent CORS bypass attempts via protocol smuggling.
 * Returns the sanitized URL or null if invalid.
 */
export function sanitizeCorsUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Only allow http/https protocols
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
      return null;
    }

    // Prevent localhost/private IP access from public pages (optional security layer)
    const hostname = urlObj.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
    ) {
      // Allow in development, block in production
      if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
        return null;
      }
    }

    const isBareOrigin =
      urlObj.pathname === "/" && urlObj.search.length === 0 && urlObj.hash.length === 0;

    return isBareOrigin ? urlObj.origin : urlObj.href;
  } catch {
    return null;
  }
}

/**
 * Create a CORS-safe proxy URL for fetching external resources.
 * Useful for embedding content from origins that don't support CORS.
 * 
 * @param targetUrl - The URL to proxy
 * @param proxyEndpoint - Your server's CORS proxy endpoint
 */
export function createProxyUrl(targetUrl: string, proxyEndpoint: string): string {
  const sanitized = sanitizeCorsUrl(targetUrl);
  if (!sanitized) {
    throw new Error(`Invalid URL for CORS proxy: ${targetUrl}`);
  }
  
  const encoded = encodeURIComponent(sanitized);
  return `${proxyEndpoint}?url=${encoded}`;
}
