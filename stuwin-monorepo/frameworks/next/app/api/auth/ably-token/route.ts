import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';
import ablyRest from '@/lib/integrations/ablyClient';

export const POST = unifiedApiHandler(async (request: NextRequest, { authData }) => {
  try {
    // Check if authData exists
    if (!authData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Ably is configured
    if (!ablyRest) {
      console.error('Ably REST client not initialized');
      return NextResponse.json({ error: 'Ably service not configured' }, { status: 503 });
    }

    const accountId = authData.account.id;

    // Generate Ably token for the authenticated user with subscribe permissions
    const tokenRequest = await ablyRest.auth.createTokenRequest({
      clientId: accountId.toString(),
      capability: {
        // Allow all operations on all channels (for debugging)
        '*': ['*']
      }
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error('Error generating Ably token', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
});
