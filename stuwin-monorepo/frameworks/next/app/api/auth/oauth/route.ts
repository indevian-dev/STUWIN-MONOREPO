import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';
import supabase from '@/lib/integrations/supabaseServiceRoleClient';

export const POST = unifiedApiHandler(async (request: NextRequest) => {
  try {
    const { provider } = await request.json();
    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }

    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ message: 'Login successful' }, { status: 200 });
  } catch (error) {
    console.error('OAuth error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
