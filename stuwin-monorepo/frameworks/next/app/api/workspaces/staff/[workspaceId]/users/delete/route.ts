import { NextRequest, NextResponse } from "next/server";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
import { ValidationService, Rules, Sanitizers } from "@/lib/app-core-modules/services/ValidationService";

const deleteUserSchema = {
  userId: {
    rules: [Rules.required("userId"), Rules.uuid("userId")],
    sanitizers: [Sanitizers.trim, Sanitizers.lowercase],
  },
};

export const DELETE = unifiedApiHandler(async (request: NextRequest, { module }) => {
  try {
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
