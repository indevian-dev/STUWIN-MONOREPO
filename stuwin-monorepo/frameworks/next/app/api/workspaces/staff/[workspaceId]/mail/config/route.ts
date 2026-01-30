import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";

export const GET: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log }: ApiHandlerContext) => {
    log.debug("Fetching mail configuration");

    try {
      const config = {
        smtp_host: "smtp.zeptomail.com",
        smtp_port: process.env.ZEPTOMAIL_SMTP_PORT || "587",
        smtp_username: "emailapikey",
        from_email: process.env.ZEPTOMAIL_FROM_EMAIL || "",
        from_name: process.env.ZEPTOMAIL_FROM_NAME || "",
        api_key: process.env.ZEPTOMAIL_API_KEY ? "***configured***" : "",
        smtp_password: process.env.ZEPTOMAIL_SMTP_PASSWORD
          ? "***configured***"
          : "",
      };

      log.info("Mail configuration fetched");
      return NextResponse.json({ config });
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      log.error("Error fetching mail configuration", err);
      return NextResponse.json(
        { error: "Failed to fetch configuration", details: err.message },
        { status: 500 },
      );
    }
  },
);

export const POST: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log }: ApiHandlerContext) => {
    try {
      const body = await request.json();
      const { api_key, smtp_password, from_email, from_name } = body;

      if (!api_key || !smtp_password || !from_email) {
        return NextResponse.json(
          { error: "Missing required configuration fields" },
          { status: 400 },
        );
      }

      log.info("Mail configuration updated");
      return NextResponse.json({
        success: true,
        message:
          "Configuration saved successfully. Please update your environment variables.",
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      log.error("Error saving mail configuration", err);
      return NextResponse.json(
        { error: "Failed to save configuration", details: err.message },
        { status: 500 },
      );
    }
  },
);
