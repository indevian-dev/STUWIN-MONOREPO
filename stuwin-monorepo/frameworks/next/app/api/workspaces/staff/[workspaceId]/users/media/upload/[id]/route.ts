import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log }: ApiHandlerContext) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    const { fileType, fileName } = await request.json();
    if (!fileType) {
      return NextResponse.json({ error: 'File type is required' }, { status: 400 });
    }
    // Validate S3 credentials
    const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
    if (!accessKeyId || !secretAccessKey) {
      return NextResponse.json({ error: 'S3 credentials not configured' }, { status: 500 });
    }
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'global',
      endpoint: process.env.AWS_S3_ENDPOINT,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `products/${id}/${fileName}.${fileType.split('/')[1]}`,
      ContentType: fileType,
    };
    const command = new PutObjectCommand(s3Params);
    const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 600 });
    return NextResponse.json({ uploadURL, fileName }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error generating pre-signed URL';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
