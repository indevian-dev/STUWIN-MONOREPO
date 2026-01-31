import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const DELETE = unifiedApiHandler(async (request: NextRequest, { log }) => {
  log.info('Account delete endpoint placeholder');
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
});
