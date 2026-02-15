import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

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
      return errorResponse('Invalid API key', 401, "UNAUTHORIZED");
    }
  }

  try {
    const result = await module.jobs.handleQuestionGeneratorWebhook();
    return okResponse(result);
  } catch (error) {
    if (log) log.error('Failed to process question generator webhook', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to process webhook';
    return serverErrorResponse(errorMessage);
  }
});

// Health check endpoint
export const GET = unifiedApiHandler(async (request: NextRequest) => {
  return okResponse({ service: 'Questions Generator Webhook', status: 'healthy', timestamp: new Date().toISOString() });
});
