import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { ROLES } from "@/lib/app-infrastructure/database";
export const POST: ApiRouteHandler = withApiHandler(
  async (
    request: NextRequest,
    { authData, params, log, db }: ApiHandlerContext,
  ) => {
    try {
      if (!params) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
      const { id } = await params;
      const { permission, action } = await request.json();
      if (!permission || !action) {
        return NextResponse.json(
          { error: "Permission and action are required" },
          { status: 400 },
        );
      }
      if (action !== "add" && action !== "remove") {
        return NextResponse.json(
          { error: 'Action must be "add" or "remove"' },
          { status: 400 },
        );
      }
      // Get current role
      const [role] = await db.query(
        "SELECT permissions FROM type::thing($table, $id)",
        { table: ROLES, id }
      );
      if (!role) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }
      let permissions = Array.isArray(role.permissions) ? role.permissions : [];
      if (action === "add") {
        if (!permissions.includes(permission)) {
          permissions.push(permission);
        }
      } else {
        permissions = permissions.filter((p) => p !== permission);
      }
      // Update permissions
      const updated = await db.query(
        "UPDATE type::thing($table, $id) SET permissions = $permissions RETURN AFTER",
        { table: ROLES, id, permissions }
      );
      return NextResponse.json(
        {
          role: updated[0],
          action: action === "add" ? "added" : "removed",
          permission,
        },
        { status: 200 },
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update permissions";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
