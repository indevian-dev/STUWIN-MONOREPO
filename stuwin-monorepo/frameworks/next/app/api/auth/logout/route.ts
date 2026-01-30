
import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
import { CookieAuthenticator } from "@/lib/app-access-control/authenticators/CookieAuthenticator";

export const POST = unifiedApiHandler(async (request: NextRequest, { authData, log }) => {
  try {
    log.info("Logout request initiated");

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );

    const { authCookiesResponse } = CookieAuthenticator.clearAuthCookies({ response });

    log.info("Logout completed", { accountId: authData?.account?.id });
    return authCookiesResponse;
  } catch (error) {
    log.error("Logout error", error as Error);

    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      { status: 200 }
    );

    const { authCookiesResponse } = CookieAuthenticator.clearAuthCookies({ response });
    return authCookiesResponse;
  }
});

