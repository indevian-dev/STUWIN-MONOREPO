
import { NextRequest } from 'next/server';
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { CookieAuthenticator } from "@/lib/middleware/authenticators/CookieAuthenticator";
import { okResponse } from '@/lib/middleware/responses/ApiResponse';

export const POST = unifiedApiHandler(async (request: NextRequest, { authData, log }) => {
  try {
    log.info("Logout request initiated");

    const response = okResponse({ success: true, message: "Logged out successfully",  });

    const { authCookiesResponse } = CookieAuthenticator.clearAuthCookies({ response });

    log.info("Logout completed", { accountId: authData?.account?.id });
    return authCookiesResponse;
  } catch (error) {
    log.error("Logout error", error as Error);

    const response = okResponse({ success: true, message: "Logged out successfully",  });

    const { authCookiesResponse } = CookieAuthenticator.clearAuthCookies({ response });
    return authCookiesResponse;
  }
});

