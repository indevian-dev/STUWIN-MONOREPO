import type { NextRequest } from 'next/server';
import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, log }: ApiHandlerContext) => {
  if (!authData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accountId = authData.account.id;
  const { fileType, fileName } = await request.json();

  if (!fileType) {
    return NextResponse.json({ error: 'File type is required' }, { status: 400 });
  }

  log.info('Generating upload URL for account media', { accountId, fileName });

  // Validate AWS credentials
  if (!process.env.AWS_S3_ACCESS_KEY_ID || !process.env.AWS_S3_SECRET_ACCESS_KEY) {
    log.error('AWS credentials not configured');
    return NextResponse.json({ error: 'S3 configuration error' }, { status: 500 });
  }

  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'global',
    endpoint: process.env.AWS_S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
    },
  });

  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `accounts/${accountId}/${fileName}.${fileType.split('/')[1]}`,
    ContentType: fileType,
  };

  try {
    const command = new PutObjectCommand(s3Params);
    const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 600 });
    log.info('Upload URL generated', { accountId, fileName });
    return NextResponse.json({ uploadURL, fileName }, { status: 200 });
  } catch (error) {
    log.error('Error generating pre-signed URL', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Error generating pre-signed URL' }, { status: 500 });
  }
});
