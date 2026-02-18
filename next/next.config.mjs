import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    env: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'stuwin.ai',
        NEXT_PUBLIC_S3_PREFIX: process.env.NEXT_PUBLIC_S3_PREFIX || 'https://s3.stuwin.ai/',
        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
        NEXT_PUBLIC_ABLY_API_KEY: process.env.NEXT_PUBLIC_ABLY_API_KEY || '',
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 's3.stuwin.ai',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'r2.stuwin.ai',
                port: '',
                pathname: '/**',
            },
        ],
    },
    turbopack: {
        root: path.resolve(__dirname, '../'),
    },
};

export default withNextIntl(nextConfig);

