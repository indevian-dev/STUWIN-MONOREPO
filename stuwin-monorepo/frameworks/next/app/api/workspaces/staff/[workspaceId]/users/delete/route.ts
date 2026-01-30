import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { USERS, ACCOUNTS } from "@/lib/app-infrastructure/database";
import {
  ValidationService,
  Rules,
  Sanitizers,
} from "@/lib/app-core-modules/services/ValidationService";
import type {
  ApiRouteHandler,
  ApiHandlerContext,
} from "@/types/next";
const deleteUserSchema = {
  userId: {
    rules: [Rules.required("userId"), Rules.uuid("userId")],
    sanitizers: [Sanitizers.trim, Sanitizers.lowercase],
  },
};
export const DELETE: ApiRouteHandler = withApiHandler(
  async (request: NextRequest, { authData, log, db }: ApiHandlerContext) => {
    try {
      if (!authData) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const body = await request.json();
      // Validate and sanitize input
      const validation = ValidationService.validate(body, deleteUserSchema);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: "Validation failed",
            errors: validation.errors.reduce(
              (acc: Record<string, string>, err: any) => {
                acc[err.field] = err.message;
                return acc;
              },
              {} as Record<string, string>,
            ),
          },
          { status: 400 },
        );
      }
      const { userId } = validation.sanitized as { userId: string };
      const accountId = authData.account.id;
      const userRecordId = userId.includes(":") ? userId : `${USERS}:${userId}`;

      const [user] = await db.query(
        `SELECT id, email, name, lastName FROM ${USERS} WHERE id = $userId LIMIT 1`,
        { userId: userRecordId },
      );
      if (!user) {
        throw new Error("USER_NOT_FOUND");
      }

      const updatedAccounts = await db.query(
        `UPDATE ${ACCOUNTS} SET userId = NONE, updatedAt = $updatedAt WHERE userId = $userId RETURN AFTER`,
        { userId: userRecordId, updatedAt: new Date() },
      );

      await db.query("DELETE $record", { record: userRecordId });

      const result = {
        deletedUser: user,
        disconnectedAccounts: updatedAccounts.length,
        affectedAccounts: updatedAccounts,
      };
      return NextResponse.json(
        {
          message: "User deleted successfully",
          data: {
            userId: result.deletedUser.id,
            userEmail: result.deletedUser.email,
            disconnectedAccounts: result.disconnectedAccounts,
          },
        },
        { status: 200 },
      );
    } catch (error) {
      if (error instanceof Error && error.message === "USER_NOT_FOUND") {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete user";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
