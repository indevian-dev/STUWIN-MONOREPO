
import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
import { CookieAuthenticator } from "@/lib/app-access-control/authenticators/CookieAuthenticator";
import { ConsoleLogger } from "@/lib/app-infrastructure/loggers/ConsoleLogger";

export const POST = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const body = await request.json();
    const { email, password, deviceInfo } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          error: result.error,
          formError: result.formError,
        },
        { status: result.status }
      );
    }

    // Create minimal response
    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully"
    }, { status: 200 });

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
    return NextResponse.json(
      { error: "Server error occurred" },
      { status: 500 }
    );
  }
});

