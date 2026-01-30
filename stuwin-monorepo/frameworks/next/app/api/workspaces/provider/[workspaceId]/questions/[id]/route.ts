
import { NextResponse } from 'next/server';
import { unifiedApiHandler } from '@/lib/app-access-control/interceptors';

export const GET = unifiedApiHandler(async (request, { module, params }) => {
  const id = params?.id;

  if (!id) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const result = await module.learning.getQuestionById(id as string);

  if (!result.success || !result.data) {
    return NextResponse.json({ error: result.error || "Question not found" }, { status: 404 });
  }

  return NextResponse.json({ question: result.data }, { status: 200 });
});
