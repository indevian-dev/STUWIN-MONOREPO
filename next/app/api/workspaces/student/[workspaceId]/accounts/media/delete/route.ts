import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import s3 from '@/lib/integrations/aws/s3.client';
import { DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { errorResponse, serverErrorResponse, messageResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(async (request: NextRequest, { log }) => {
  const { filename, filePath } = await request.json();

  if (!filename || !filePath) {
    return errorResponse('Filename and filePath are required', 400);
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
      return serverErrorResponse('File could not be deleted');
    } catch (headErr) {
      if (headErr instanceof Error && headErr.name === 'NotFound') {
        log.info('File deleted successfully', { filename });
        return messageResponse('File deleted successfully');
      }
      throw headErr;
    }
  } catch (error) {
    log.error('Error deleting file', error instanceof Error ? error : new Error(String(error)));
    return serverErrorResponse('An error occurred while deleting the file');
  }
});
