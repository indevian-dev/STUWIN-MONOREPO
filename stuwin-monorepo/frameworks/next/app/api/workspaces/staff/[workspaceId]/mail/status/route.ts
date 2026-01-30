import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";

export const GET: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log }: ApiHandlerContext) => {
    log.debug("Checking mail service status");

    try {
      const apiKey = process.env.ZEPTOMAIL_API_KEY;
      const smtpPassword = process.env.ZEPTOMAIL_SMTP_PASSWORD;
      const mailAgent = process.env.ZEPTOMAIL_MAIL_AGENT;

      const api_configured = !!apiKey;
      const smtp_configured = !!smtpPassword;

      let status = "operational";
      let message = "ZeptoMail service is operational";

      if (!api_configured && !smtp_configured) {
        status = "down";
        message = "ZeptoMail is not configured.";
      } else if (!api_configured || !smtp_configured) {
        status = "degraded";
        message = "ZeptoMail is partially configured.";
      }

      log.info("Mail service status checked", { status });

      return NextResponse.json({
        status,
        message,
        api_configured,
        smtp_configured,
        mail_agent: mailAgent || "Not configured",
        last_checked: new Date().toISOString(),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unknown error");
      log.error("Error checking mail service status", err);
      return NextResponse.json(
        { error: "Failed to check service status", details: err.message },
        { status: 500 },
      );
    }
  },
);
