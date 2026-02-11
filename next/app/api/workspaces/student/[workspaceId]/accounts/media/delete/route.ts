import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import s3 from '@/lib/integrations/aws/s3.client';
import { DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

export const POST = unifiedApiHandler(async (request: NextRequest, { log }) => {
  const { filename, filePath } = await request.json();

  if (!filename || !filePath) {
    return NextResponse.json({ error: 'Filename and filePath are required' }, { status: 400 });
  }

  log.info('Deleting account media file', { filename, filePath });

  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: `${filePath}/${filename}`,
    };

    const deleteCommand = new DeleteObjectCommand(params);
    await s3.send(deleteCommand);

    try {
      const headCommand = new HeadObjectCommand(params);
      await s3.send(headCommand);
      log.error('File still exists after deletion');
      return NextResponse.json({ error: 'File could not be deleted' }, { status: 500 });
    } catch (headErr) {
      if (headErr instanceof Error && headErr.name === 'NotFound') {
        log.info('File deleted successfully', { filename });
        return NextResponse.json({ message: 'File deleted successfully' }, { status: 200 });
      }
      throw headErr;
    }
  } catch (error) {
    log.error('Error deleting file', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({
      error: 'An error occurred while deleting the file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});
