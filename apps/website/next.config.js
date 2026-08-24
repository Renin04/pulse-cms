const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

module.exports = (phase) => {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;

  /** @type {import('next').NextConfig} */
  const nextConfig = {
    // Production runs with next start (Node.js server) — required for API routes.
    // Static export is disabled because dynamic API routes ([id], [slug])
    // are incompatible with output: 'export'.
    output: undefined,

    // Container/CI builds must not fail on eslint-plugin resolution issues
    // (rule 'react/no-danger' missing on the builder). Lint stays a local/CI
    // concern (`npm run lint`), not a production-build gate.
    eslint: {
      ignoreDuringBuilds: true,
    },

    // Keep dev builds in `.next` so local hot-reload does not clash with
    // production/export artifacts that live in `dist`.
    distDir: isDevServer ? '.next2' : 'dist',

    images: {
      unoptimized: true,
    },

    transpilePackages: ['@pulse/blocks', '@pulse/renderer', '@pulse/core', '@pulse/editor', 'shiki'],

    experimental: {
      optimizePackageImports: ['lucide-react'],
      // Thread-restricted Hamravesh builder: concurrent build workers each
      // loading the native Prisma engine spawn more OS threads than the
      // builder allows (os error 11 → SIGABRT). Serialize the build.
      cpus: 1,
      workerThreads: false,
    },

    trailingSlash: true,

    // Production security headers
    async headers() {
      const isProd = process.env.NODE_ENV === 'production';
      const cspDirectives = [
        "default-src 'self'",
        // unsafe-eval only in dev (HMR); production does not need it.
        isProd
          ? "script-src 'self' 'unsafe-inline'"
          : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "media-src 'self'",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        ...(isProd ? ["upgrade-insecure-requests"] : []),
      ];

      return [
        {
          source: '/:path*',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            {
              key: 'Permissions-Policy',
              value: 'camera=(), microphone=(), geolocation=()',
            },
            {
              key: 'X-DNS-Prefetch-Control',
              value: 'on',
            },
            {
              key: 'Content-Security-Policy',
              value: cspDirectives.join('; '),
            },
            ...(isProd ? [
              {
                key: 'Strict-Transport-Security',
                value: 'max-age=63072000; includeSubDomains; preload',
              },
            ] : []),
          ],
        },
        {
          source: '/api/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, max-age=0',
            },
          ],
        },
      ];
    },
  };

  return nextConfig;
};
