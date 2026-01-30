import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { eq, and } from "drizzle-orm";
import { accountNotifications } from "@/lib/app-infrastructure/database/schema";
export const PATCH: ApiRouteHandler = withApiHandler(
  async (
    request: NextRequest,
    { authData, params, log, db, isValidSlimId }: ApiHandlerContext,
  ) => {
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const resolvedParams = await params;
      const id = (resolvedParams as Record<string, string>)?.id;
      if (!id || !isValidSlimId(id)) {
        return NextResponse.json(
          { error: "Valid notification ID is required" },
          { status: 400 },
        );
      }
      const { mark_as_read } = await request.json();
      const accountId = authData.account.id;
      // Check if notification exists and belongs to account
      const [notification] = await db
        .select({
          id: accountsNotifications.id,
          accountId: accountsNotifications.accountId,
        })
        .from(accountsNotifications)
        .where(
          and(
            eq(accountsNotifications.id, id),
            eq(accountsNotifications.accountId, accountId),
          ),
        )
        .limit(1);
      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found or access denied" },
          { status: 404 },
        );
      }
      // Update notification
      const [updatedNotification] = await db
        .update(accountsNotifications)
        .set({
          markAsRead: mark_as_read,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(accountsNotifications.id, id),
            eq(accountsNotifications.accountId, accountId),
          ),
        )
        .returning();
      return NextResponse.json({
        success: true,
        notification: updatedNotification,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Internal server error";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
  },
);
