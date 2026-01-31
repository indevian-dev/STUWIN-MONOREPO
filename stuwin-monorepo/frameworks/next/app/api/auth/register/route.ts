import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
import { CookieAuthenticator } from "@/lib/app-access-control/authenticators/CookieAuthenticator";

/**
 * POST /api/auth/register
 *
 * Registration endpoint decoupled into AuthService
 */
export const POST = unifiedApiHandler(
  async (request: NextRequest, { module, log }) => {
    try {
      const body = await request.json().catch(() => ({}));

      // Extract client info for session creation
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
        request.headers.get("x-real-ip") ||
        "0.0.0.0";
      const userAgent = request.headers.get("user-agent") || "unknown";

      // Call AuthService to handle registration logic
      const result = await module.auth.register({
        ...body,
        firstName: body.name, // Map UI 'name' to 'firstName'
        ip,
        userAgent,
      });

      if (!result.success) {
        if (log) log.warn("Registration failed", { email: body.email, error: result.error });
        return NextResponse.json(
          {
            error: result.error || "Registration failed",
            field: result.formError ? Object.keys(result.formError)[0] : "registration",
            details: result.formError,
          },
          { status: result.status || 400 },
        );
      }

      // Prepare success response
      const responsePayload = {
        ...result.data,
        success: true,
      };

      const response = NextResponse.json(responsePayload, { status: 201 });

      // Set authentication cookies if session was created
      if (result.data?.session?.id) {
        const { authCookiesResponse } = CookieAuthenticator.setAuthCookies({
          response,
          data: {
            session: result.data.session.id,
            expireAt: new Date(result.data.session.expires_at),
          },
        });
        return authCookiesResponse;
      }

      return response;
    } catch (error) {
      if (log) log.error("Registration route error", error);
      return NextResponse.json(
        { error: "An unexpected error occurred during registration" },
        { status: 500 },
      );
    }
  }
);
