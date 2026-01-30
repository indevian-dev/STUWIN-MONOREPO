
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";

export const GET = unifiedApiHandler(async (request, { module }) => {
  const cities = await module.content.supportRepo.listAllCities();
  return NextResponse.json({ cities: cities || [] });
});


