
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const GET = unifiedApiHandler(async (request, { module }) => {
  const data = await module.content.contentRepo.findPageByType('RULES');

  if (!data) {
    return NextResponse.json({ error: 'Rules not found' }, { status: 404 });
  }

  return NextResponse.json({ content: data }, { status: 200 });
});


