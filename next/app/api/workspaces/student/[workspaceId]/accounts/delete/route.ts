import { NextRequest, NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

export const DELETE = unifiedApiHandler(async (request: NextRequest, { log }) => {
  log.info('Account delete endpoint placeholder');
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
});
