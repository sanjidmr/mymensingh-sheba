import type {NextConfig} from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const isApp = process.env.BUILD_TARGET === 'app';
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const imageConfig: NonNullable<NextConfig['images']> = {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'picsum.photos',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
      port: '',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: '*.supabase.co',
      port: '',
      pathname: '/storage/v1/**',
    },
  ],
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: imageConfig,
  output: 'standalone',
  transpilePackages: ['motion'],
  pageExtensions: isApp
    ? ['app.tsx', 'tsx', 'jsx']
    : ['web.tsx', 'web.ts', 'tsx', 'ts', 'jsx', 'js'],
  ...(isApp
    ? {
        output: 'export' as const,
        images: { ...imageConfig, unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default withBundleAnalyzer(nextConfig);