import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
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
            {
                protocol: 'https',
                hostname: 's3.stuwin.ai',
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
