import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';

import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
export const GET = unifiedApiHandler(async (request: NextRequest, { module, params }) => {
  try {
    const { id: userId } = params || {};

    if (!userId) {
      return errorResponse("User ID is required");
    }

    // Handle potential double-encoding or legacy ID formats
    const normalizedUserId = userId.includes(':') ? userId.split(':')[1] : userId; // Assuming clean ID is preferred for service calls, or service handles it. 
    // Wait, DB schema uses generateSlimId() so IDs shouldn't have colons usually unless it's SurrealDB legacy.
    // The previous code had: const normalizedUserId = userId?.includes(':') ? userId : `${USERS}:${userId}`;
    // This implies legacy ID format expected "table:id".
    // But Drizzle migration usually moves to bare IDs.
    // However, `findUserById` in repository does `eq(users.id, id)`. 
    // If the DB has IDs like "users:123", we must pass that.
    // If we assume Drizzle schema, IDs are varchars.
    // I will use the passed ID directly. If legacy logic required adding `USERS:`, it might be because of SurrealDB.
    // But since we are using Postgres/Drizzle, the IDs should match what's in the DB.
    // The repository logic `findUserById` simply queries `users` table where `id` matches.
    // I'll trust the user ID passed in params matches the DB.

    // Actually, looking at other refactored routes (Subjects), I removed the logic adding Table Name prefixes.
    // So I will just pass `userId`.

    const result = await module.auth.getUserDetails(userId);

    if (!result.success) {
      const status = result.status || 500;
      return errorResponse(result.error, status);
    }

    return okResponse(result.data?.user);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch user';
    return serverErrorResponse(errorMessage);
  }
});
