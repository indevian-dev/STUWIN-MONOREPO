import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';
import s3 from "@/lib/integrations/awsClient";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const POST = unifiedApiHandler(async (request: NextRequest, { auth, log }) => {
  const accountId = auth.accountId;
  const { fileType, fileName } = await request.json();

  if (!fileType) {
    return NextResponse.json({ error: 'File type is required' }, { status: 400 });
  }

  log.info('Generating upload URL for account media', { accountId, fileName });

  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `accounts/${accountId}/${fileName}.${fileType.split('/')[1]}`,
    ContentType: fileType,
  };

  try {
    const command = new PutObjectCommand(s3Params);
    const uploadURL = await getSignedUrl(s3, command, { expiresIn: 600 });
    log.info('Upload URL generated', { accountId, fileName });
    return NextResponse.json({ uploadURL, fileName }, { status: 200 });
  } catch (error) {
    log.error('Error generating pre-signed URL', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Error generating pre-signed URL' }, { status: 500 });
  }
});
