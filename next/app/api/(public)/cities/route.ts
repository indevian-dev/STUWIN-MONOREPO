
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { okResponse } from '@/lib/middleware/responses/ApiResponse';

export const GET = unifiedApiHandler(async (request, { module }) => {
  const cities = await module.content.supportRepo.listAllCities();
  return okResponse(cities || []);
});


