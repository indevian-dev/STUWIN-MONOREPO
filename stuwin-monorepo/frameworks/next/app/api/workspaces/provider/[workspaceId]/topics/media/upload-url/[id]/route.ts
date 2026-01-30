import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import {
  S3Client,
  PutObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { TOPICS } from '@/lib/app-infrastructure/database';

export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, params, log, db }: ApiHandlerContext) => {
  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = (await params) ?? {};
    if (!id) {
      return NextResponse.json(
        { error: 'Valid topic ID is required' },
        { status: 400 }
      );
    }
    const topicRecordId = id.includes(':') ? id : `${TOPICS}:${id}`;

    // Verify topic exists
    const [topic] = await db.query(
      `SELECT id FROM ${TOPICS} WHERE id = $topicId LIMIT 1`,
      { topicId: topicRecordId }
    );

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { fileName, fileType } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'fileName and fileType are required' },
        { status: 400 }
      );
    }

    // Validate file type (only PDF)
    if (fileType !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    log.info('Generating PDF upload URL', { topicId, fileName });

    // Validate AWS credentials
    if (!process.env.AWS_S3_ACCESS_KEY_ID || !process.env.AWS_S3_SECRET_ACCESS_KEY) {
      log.error('AWS credentials not configured');
      return NextResponse.json(
        { error: 'S3 configuration error' },
        { status: 500 }
      );
    }

    const s3Client = new S3Client({
      region: process.env.AWS_S3_REGION || 'global',
      endpoint: process.env.AWS_S3_ENDPOINT || 'https://s3.tebi.io',
      credentials: {
        accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
      },
    });

    // Generate unique S3 key
    const timestamp = Date.now();
    const s3Key = `topics/pdfs/${id}/${timestamp}-${fileName}`;

    const s3Params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
    };

    const command = new PutObjectCommand(s3Params);
    const uploadURL = await getSignedUrl(s3Client, command, { expiresIn: 600 });

    log.info('Upload URL generated', { topicId: id, s3Key });

    return NextResponse.json({
      uploadURL,
      s3Key,
      fileName
    }, { status: 200 });

  } catch (error) {
    log.error('Error generating PDF upload URL', error as Error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
});

