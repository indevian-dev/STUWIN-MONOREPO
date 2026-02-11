import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

/**
 * Webhook for Upstash Queue - AI Question Generation
 * Decoupled into JobService
 */
export const POST = unifiedApiHandler(async (request: NextRequest, { module, log }) => {
  // Validate API key if configured
  const queueApiKey = process.env.QUEUE_API_KEY;
  if (queueApiKey) {
    const providedKey = request.headers.get('x-api-key');
    if (providedKey !== queueApiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }
  }

  try {
    const result = await module.jobs.handleQuestionGeneratorWebhook();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (log) log.error('Failed to process question generator webhook', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process webhook';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});

// Health check endpoint
export const GET = unifiedApiHandler(async (request: NextRequest) => {
  return NextResponse.json({
    service: 'Questions Generator Webhook',
    status: 'healthy',
    timestamp: new Date().toISOString()
  }, { status: 200 });
});
