import type { NextConfig } from 'next';
import { loadEnvConfig } from '@next/env';
import path from 'path';

loadEnvConfig(path.resolve(import.meta.dirname, '../..'));

const isStaticExport = process.env.NODE_ENV === 'production';
const configuredApiOrigin = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
if (!configuredApiOrigin) {
  throw new Error(
    'NEXT_PUBLIC_API_URL must be configured before starting or building the dashboard.',
  );
}
try {
  const url = new URL(configuredApiOrigin);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
} catch {
  throw new Error('NEXT_PUBLIC_API_URL must be a valid HTTP(S) URL.');
}
const apiOrigin = configuredApiOrigin;

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: 'export' } : {}),
  trailingSlash: false,
  ...(isStaticExport
    ? {}
    : {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `${apiOrigin}/api/:path*`,
            },
          ];
        },
      }),
};

export default nextConfig;
