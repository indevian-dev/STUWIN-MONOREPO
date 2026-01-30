import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ROLES } from "@/lib/app-infrastructure/database";
export const GET: ApiRouteHandler = withApiHandler(
  async (
    request: NextRequest,
    { authData, params, log, db }: ApiHandlerContext,
  ) => {
    try {
      if (!params) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      const { id } = await params;
      const [role] = await db.query(
        "SELECT * FROM type::thing($table, $id)",
        { table: ROLES, id }
      );
      if (!role) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }
      return NextResponse.json({ role });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch role";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
