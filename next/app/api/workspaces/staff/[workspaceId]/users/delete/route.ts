import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/middleware/handlers";
import { z } from "zod";

const DeleteUserSchema = z.object({
  userId: z.string().uuid("userId must be a valid UUID").trim().toLowerCase(),
});

export const DELETE = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
    const body = await request.json();

    const parsed = DeleteUserSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.errors.reduce(
        (acc: Record<string, string>, err) => {
          acc[String(err.path[0] || 'unknown')] = err.message;
          return acc;
        },
        {} as Record<string, string>,
      );
      return NextResponse.json({ error: "Validation failed", errors }, { status: 400 });
    }

    const { userId } = parsed.data;

    const result = await module.auth.deleteUser(userId);

    if (!result.success) {
      const status = result.status || 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(
      {
        message: "User deleted successfully",
        data: result.data,
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
