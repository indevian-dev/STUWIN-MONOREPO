import type { ApiRouteHandler, ApiHandlerContext } from '@/types/next';
import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/app-access-control/interceptors';
import supabase from '@/lib/integrations/supabaseServiceRoleClient';
export const POST: ApiRouteHandler = withApiHandler(async (request: NextRequest, { log }: ApiHandlerContext) => {
  const { provider } = await request.json();
  if (!provider) {
    return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
  }
  try {
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: 'Login successful' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});


