import { NextRequest } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/_Middleware.index";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/Response.Api.middleware';
import { z } from "zod";

const DeleteUserSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID").trim().toLowerCase(),
});

export const DELETE = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const body = await request.json();

    const parsed = DeleteUserSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed");
    }

    const { userId } = parsed.data;

    const result = await module.auth.deleteUser(userId);

    if (!result.success) {
      const status = result.status || 500;
      return errorResponse(result.error, status);
    }

    return okResponse(result.data, "User deleted successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
    return serverErrorResponse(errorMessage);
  }
});
