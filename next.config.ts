import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async redirects() {
    return [
      { source: '/browse', destination: '/briefs', permanent: true },
      { source: '/browse/:id', destination: '/briefs/:id', permanent: true },
      { source: '/submissions', destination: '/catalog', permanent: true },
      { source: '/music', destination: '/catalog', permanent: true },
    ];
  },
};

export default nextConfig;
