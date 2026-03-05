import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@staffpicks/ui', '@staffpicks/utils', '@staffpicks/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
