
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse } from '@/lib/middleware/Response.Api.middleware';

export const GET = unifiedApiHandler(async (request, { module }) => {
  const cities = await module.content.supportRepo.listAllCities();
  return okResponse(cities || []);
});


