import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import supabase from '@/lib/integrations/supabase/service-role.client';
import { errorResponse, serverErrorResponse, messageResponse } from '@/lib/middleware/responses/ApiResponse';

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
