const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

module.exports = (phase) => {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;

  /** @type {import('next').NextConfig} */
  const nextConfig = {
    // Production runs with next start (Node.js server) — required for API routes.
    // Static export is disabled because dynamic API routes ([id], [slug])
    // are incompatible with output: 'export'.
    output: undefined,

    // Keep dev builds in `.next` so local hot-reload does not clash with
    // production/export artifacts that live in `dist`.
    distDir: isDevServer ? '.next' : 'dist',

    images: {
      unoptimized: true,
    },

    transpilePackages: ['@pulse/blocks', '@pulse/renderer', '@pulse/core', '@pulse/editor'],

    trailingSlash: true,

    // Production security headers
    async headers() {
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
