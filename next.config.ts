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
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  productionBrowserSourceMaps: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  ...(!isApp
    ? {
        async headers() {
          return [
            {
              source: '/:path*',
              headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
                { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
              ],
            },
          ];
        },
      }
    : {}),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // images: imageConfig,
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