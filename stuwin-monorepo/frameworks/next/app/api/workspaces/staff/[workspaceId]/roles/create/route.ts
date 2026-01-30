import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ROLES } from "@/lib/app-infrastructure/database";
export const POST: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
    try {
      const body = await request.json();
      const { name, description, permissions } = body;
      if (!name) {
        return NextResponse.json(
          { error: "Role name is required" },
          { status: 400 },
        );
      }
      const roleData = {
        name,
        permissions: Array.isArray(permissions) ? permissions : [],
      };

      const created = await db.query(`CREATE ${ROLES} CONTENT $data`, {
        data: roleData,
      });

      const role = created[0];
      return NextResponse.json({ role }, { status: 201 });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Internal server error";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
