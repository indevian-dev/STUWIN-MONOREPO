import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import ablyRest from '@/lib/integrations/ablyClient';

export const POST: ApiRouteHandler = withApiHandler(async (req, { authData, log }: ApiHandlerContext) => {
  try {
    log.info('Generating Ably token for pure token auth...');
    log.debug('ABLY_API_KEY set', { configured: !!process.env.ABLY_API_KEY });
    log.debug('ablyRest initialized', { initialized: !!ablyRest });

    // Check if authData exists
    if (!authData) {
      log.error('Authentication data not found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Ably is configured
    if (!ablyRest) {
      log.error('Ably REST client not initialized');
      return NextResponse.json({ error: 'Ably service not configured' }, { status: 503 });
    }

    const accountId = authData.account.id;
    log.info('Generating token for accountId', { accountId });

    // Generate Ably token for the authenticated user with subscribe permissions
    log.debug('Setting capabilities for account', { accountId });
    const tokenRequest = await ablyRest.auth.createTokenRequest({
      clientId: accountId.toString(),
      capability: {
        // Allow all operations on all channels (for debugging)
        '*': ['*']
      }
    });

    log.info('Token generated successfully', { accountId });
    return NextResponse.json(tokenRequest);
  } catch (error) {
    log.error('Error generating Ably token', error as Error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
});


