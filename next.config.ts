import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async redirects() {
    return [
      { source: '/orders', destination: '/dashboard/orders', permanent: false },
      { source: '/analytics', destination: '/dashboard/analytics', permanent: false },
      { source: '/integrations', destination: '/dashboard/integrations', permanent: false },
      { source: '/ai', destination: '/dashboard/ai', permanent: false },
      { source: '/settings', destination: '/dashboard/settings', permanent: false },
    ];
  },
};

export default nextConfig;

