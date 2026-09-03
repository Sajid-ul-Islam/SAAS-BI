import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // serverActions enabled by default in Next.js 15
  },
};

export default nextConfig;
