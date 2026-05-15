/**
 * CORS helpers for API routes.
 */

export function getCorsHeaders(origin?: string): Record<string, string> {
  const configuredOrigin = process.env.API_CORS_ORIGIN;
  const allowedOrigin = origin || configuredOrigin || (process.env.NODE_ENV === 'development' ? '*' : undefined);

  if (!allowedOrigin) {
    // In production without explicit CORS config, deny cross-origin
    return {
      'Access-Control-Allow-Origin': '',
      'Access-Control-Allow-Methods': '',
      'Access-Control-Allow-Headers': '',
    };
  }

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function withCors(response: Response, origin?: string): Response {
  const headers = getCorsHeaders(origin);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}
