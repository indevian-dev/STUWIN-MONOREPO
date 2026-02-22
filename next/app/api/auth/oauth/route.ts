import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/_Middleware.index';
import supabase from '@/lib/integrations/supabase/Pgsql.client';
import { errorResponse, serverErrorResponse, messageResponse } from '@/lib/middleware/Response.Api.middleware';

export const POST = unifiedApiHandler(async (request: NextRequest) => {
  try {
    const { provider } = await request.json();
    if (!provider) {
      return errorResponse('Provider is required', 400);
    }

    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      return errorResponse(error.message, 401);
    }
    return messageResponse('Login successful');
  } catch (error) {
    console.error('OAuth error:', error);
    return serverErrorResponse('Internal Server Error');
  }
});
