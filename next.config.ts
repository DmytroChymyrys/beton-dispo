import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

/**
 * Canonical host. betondispo.ca (and any other alias) is redirected to this
 * host in `src/proxy.ts`, preserving path + query.
 */
const projectRoot = dirname(fileURLToPath(import.meta.url));
const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pin the workspace root: an unrelated lockfile higher up the tree would
  // otherwise be inferred as the root and change what gets traced.
  turbopack: { root: projectRoot },
  poweredByHeader: false,
  // `pg` is only loaded for local Postgres connections and resolves its driver
  // at runtime; bundling it breaks that. Neon over HTTP is unaffected.
  serverExternalPackages: ['pg'],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Never let the internal admin surface be indexed or cached.
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
        ],
      },
    ];
  },
};

export default nextConfig;
