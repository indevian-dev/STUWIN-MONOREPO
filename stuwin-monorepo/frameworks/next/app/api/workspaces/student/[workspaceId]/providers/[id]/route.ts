import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { workspaces } from "@/lib/app-infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";

export const GET: ApiRouteHandler = withApiHandler(
  async (
    request: NextRequest,
    { authData, params, log, db }: ApiHandlerContext,
  ) => {
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const { id } = resolvedParams as { id: string };

    log.debug("Fetching organization", { id });

    try {
      const result = await db
        .select()
        .from(workspaces)
        .where(
          and(
            eq(workspaces.id, id),
            eq(workspaces.isActive, true)
          )
        )
        .limit(1);

      if (!result.length) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 },
        );
      }

      log.info("Organization fetched", { id });
      return NextResponse.json(result[0], { status: 200 });
    } catch (error) {
      log.error(
        "Error fetching organization",
        error instanceof Error ? error : new Error(String(error)),
      );
      return NextResponse.json(
        { error: "Failed to fetch organization data" },
        { status: 500 },
      );
    }
  },
);
