import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  outputFileTracingIncludes: {
    '/api/briefs/[id]/pdf': ['./lib/pdf/fonts/**/*', './public/brand/thought-collective-mark.png'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async redirects() {
    return [
      { source: '/browse', destination: '/briefs', permanent: true },
      { source: '/browse/:id', destination: '/briefs/:id', permanent: true },
      { source: '/submissions', destination: '/dashboard', permanent: false },
      { source: '/music', destination: '/dashboard', permanent: false },
      // Sonant-only pages that the Thought Collective portal drops.
      { source: '/generator', destination: '/briefs', permanent: false },
      { source: '/generator/:path*', destination: '/briefs', permanent: false },
      { source: '/catalogs', destination: '/briefs', permanent: false },
      { source: '/catalog', destination: '/briefs', permanent: false },
      { source: '/community', destination: '/briefs', permanent: false },
      { source: '/royalties', destination: '/', permanent: false },
    ];
  },
};

export default nextConfig;
