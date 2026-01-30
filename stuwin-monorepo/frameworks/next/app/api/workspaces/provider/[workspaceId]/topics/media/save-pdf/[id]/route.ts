import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import { TOPICS } from '@/lib/app-infrastructure/database';
import { getTotalPages } from '@/lib/utilities/pdfUtility';

export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { authData, params, log, db }: ApiHandlerContext) => {
  try {
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = authData.account.id;
    const resolvedParams = await params;
    const topicId = resolvedParams?.id;

    if (!topicId) {
      return NextResponse.json(
        { error: 'Valid topic ID is required' },
        { status: 400 }
      );
    }
    const topicRecordId = topicId.includes(':') ? topicId : `${TOPICS}:${topicId}`;

    const body = await request.json();
    const { s3Key, pdfPageStart, pdfPageEnd, chapterNumber } = body;

    if (!s3Key) {
      return NextResponse.json(
        { error: 's3Key is required' },
        { status: 400 }
      );
    }

    // Validate page range
    if (pdfPageStart && pdfPageEnd && pdfPageStart > pdfPageEnd) {
      return NextResponse.json(
        { error: 'pdfPageStart must be less than or equal to pdfPageEnd' },
        { status: 400 }
      );
    }

    log.info('Saving PDF metadata to topic', {
      topicId,
      s3Key,
      pdfPageStart,
      pdfPageEnd
    });

    // Download PDF from public URL to get total pages
    let totalPages: number | null = null;
    try {
      const s3Prefix = process.env.NEXT_PUBLIC_S3_PREFIX || '';
      const pdfUrl = `${s3Prefix}${s3Key}`;

      log.info('Downloading PDF to extract page count', { pdfUrl });

      const response = await fetch(pdfUrl);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const pdfBuffer = Buffer.from(arrayBuffer);

        totalPages = await getTotalPages(pdfBuffer);
        log.info('PDF page count extracted', { totalPages });
      } else {
        log.warn('PDF not yet accessible via public URL, skipping page count');
      }

    } catch (pdfError) {
      log.warn('Failed to extract PDF page count, continuing without it');
    }

    // Update topic with PDF metadata (only store S3 key, not URL)
    const updated = await db.query(
      'UPDATE $record SET pdfS3Key = $s3Key, pdfPageStart = $pdfPageStart, pdfPageEnd = $pdfPageEnd, totalPdfPages = $totalPdfPages, chapterNumber = $chapterNumber RETURN AFTER',
      {
        record: topicRecordId,
        s3Key,
        pdfPageStart: pdfPageStart || null,
        pdfPageEnd: pdfPageEnd || null,
        totalPdfPages: totalPages,
        chapterNumber: chapterNumber || null,
      }
    );
    const updatedTopic = updated[0];

    if (!updatedTopic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // TODO: Implement audit logging
    // await db.insert(actionLogs).values({
    //   action: 'upload_topic_pdf',
    //   createdBy: accountId,
    //   resourceType: 'topics',
    //   resourceId: topicId
    // });

    log.info('PDF metadata saved to topic', { topicId });

    return NextResponse.json({
      message: 'PDF uploaded successfully',
      topic: updatedTopic
    }, { status: 200 });

  } catch (error) {
    log.error('Error saving PDF metadata', error as Error);
    return NextResponse.json(
      { error: 'Failed to save PDF metadata' },
      { status: 500 }
    );
  }
});

