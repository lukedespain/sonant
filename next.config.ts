import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  outputFileTracingIncludes: {
    '/api/briefs/[id]/pdf': ['./lib/pdf/fonts/**/*'],
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
    ];
  },
};

export default nextConfig;
