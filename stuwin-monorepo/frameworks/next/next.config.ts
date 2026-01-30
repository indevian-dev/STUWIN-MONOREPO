import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@stuwin/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'stuwin.s3.tebi.io',
        port: '',
        pathname: '/**',
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname, '../../'),
  },
};

export default withNextIntl(nextConfig);
