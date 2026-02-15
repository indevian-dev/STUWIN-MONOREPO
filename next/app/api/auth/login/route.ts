
import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { CookieAuthenticator } from "@/lib/middleware/authenticators/CookieAuthenticator";
import { ConsoleLogger } from "@/lib/logging/ConsoleLogger";
import { okResponse, errorResponse, serverErrorResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const body = await request.json();
    const { email, password, deviceInfo } = body;

    // Validate input
    if (!email || !password) {
      return errorResponse("Email and password are required", 400);
    }

    // Use AuthService from ModuleFactory
    const result = await module.auth.login({
      email,
      password,
      deviceInfo,
      ip: request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "0.0.0.0",
    });

    if (!result.success || !result.data) {
      return errorResponse(result.error, result.status);
    }

    // Create minimal response
    const response = okResponse({ success: true, message: "Logged in successfully" });

    const { session, expireAt } = result.data;

    // Set authentication cookies
    const { authCookiesResponse } = CookieAuthenticator.setAuthCookies({
      response,
      data: {
        session,
        expireAt,
      },
    });

    return authCookiesResponse;
  } catch (error) {
    ConsoleLogger.error("Error in login route:", error);
    return serverErrorResponse("Server error occurred");
  }
});
