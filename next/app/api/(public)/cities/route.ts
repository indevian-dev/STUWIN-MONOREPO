
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";

export const GET = unifiedApiHandler(async (request, { module }) => {
  const cities = await module.content.supportRepo.listAllCities();
  return NextResponse.json({ cities: cities || [] });
});


