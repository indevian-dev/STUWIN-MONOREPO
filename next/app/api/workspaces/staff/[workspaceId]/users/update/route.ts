import { NextRequest } from 'next/server';
import { unifiedApiHandler } from '@/lib/middleware/handlers';
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID").trim().toLowerCase(),
  email_is_verified: z.coerce.boolean().optional(),
  phone_is_verified: z.coerce.boolean().optional(),
  emailVerified: z.coerce.boolean().optional(),
  phoneVerified: z.coerce.boolean().optional(),
});

export const PUT = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const body = await request.json();

    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation failed");
    }

    const {
      userId,
      email_is_verified,
      phone_is_verified,
      emailVerified,
      phoneVerified
    } = parsed.data;

    const nextEmailVerified = typeof emailVerified === 'boolean'
      ? emailVerified
      : (typeof email_is_verified === 'boolean' ? email_is_verified : undefined);
    const nextPhoneVerified = typeof phoneVerified === 'boolean'
      ? phoneVerified
      : (typeof phone_is_verified === 'boolean' ? phone_is_verified : undefined);

    if (typeof nextEmailVerified === 'undefined' && typeof nextPhoneVerified === 'undefined') {
      return errorResponse("Nothing to update");
    }

    const result = await module.auth.updateUserVerification(userId, {
      emailVerified: nextEmailVerified,
      phoneVerified: nextPhoneVerified
    });

    if (!result.success) {
      const status = result.status || 500;
      return errorResponse(result.error, status);
    }

    return okResponse(result.user);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update user verification';
    return serverErrorResponse(errorMessage);
  }
});
