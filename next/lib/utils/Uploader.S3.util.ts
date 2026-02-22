
/**
 * Utility to get the S3/Cloudflare public URL prefix
 */
export const getS3Prefix = (): string => {
    return process.env.NEXT_PUBLIC_S3_PREFIX || 'https://s3.stuwin.ai/';
};

/**
 * Reconstruct a full S3 URL from a path
 */
export const getS3Url = (path: string): string => {
    const prefix = getS3Prefix();

    // Ensure prefix ends with slash
    const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
    // Clean path
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;

    return `${normalizedPrefix}${normalizedPath}`;
};
