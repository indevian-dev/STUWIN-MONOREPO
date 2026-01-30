import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/integrations/supabasePostqreSQLClient";
import {
  ValidationService,
  Rules,
  Sanitizers,
} from "@/lib/app-core-modules/services/ValidationService";
const assignProviderSchema = {
  userId: {
    rules: [Rules.required("userId"), Rules.uuid("userId")],
    sanitizers: [Sanitizers.trim, Sanitizers.lowercase],
  },
};
export const POST: ApiRouteHandler = withApiHandler(
  async (req, { authData, log }: ApiHandlerContext) => {
    try {
      if (!authData?.account?.id) {
        return NextResponse.json(
          {
            error: "Unauthorized",
          },
          { status: 401 },
        );
      }
      const staffAccountId = authData.account.id;
      const body = await req.json();
      // Validate and sanitize input
      const validation = ValidationService.validate(body, assignProviderSchema);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: "Validation failed",
            errors: validation.errors.reduce(
              (acc: Record<string, string>, err: any) => {
                acc[err.field] = err.message;
                return acc;
              },
              {},
            ),
          },
          { status: 400 },
        );
      }
      const { userId } = validation.sanitized as { userId: string };
      const result = await sql.begin(async (tx) => {
        // Verify the user exists
        const [user] = await tx`
        SELECT id, email, name, last_name
        FROM users
        WHERE id = ${userId}
      `;
        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }
        // Check if user already has a provider account
        const [existingProviderAccount] = await tx`
        SELECT a.id, a.access_skope_type, a.access_skope_key
        FROM accounts a
        WHERE a.user_id = ${user.id}
        AND a.access_skope_type = 'provider'
      `;
        if (existingProviderAccount) {
          throw new Error("PROVIDER_ACCOUNT_ALREADY_EXISTS");
        }
        // Create a new account for this user (provider scope)
        const [newAccount] = await tx`
        INSERT INTO accounts (
          user_id,
          is_personal,
          suspended,
          role
        )
        VALUES (
          ${user.id},
          false,
          false,
          'basic_role'
        )
        RETURNING id
      `;
        // Create a new provider entity
        const [newProvider] = await tx`
        INSERT INTO skope_providers (
          owner_account_id,
          access_skope_type,
          access_skope_key,
          is_blocked
        )
        VALUES (
          ${newAccount.id},
          'provider',
          ${newAccount.id}::text,
          false
        )
        RETURNING id
      `;
        // Update the account with provider scope keys
        const [updatedAccount] = await tx`
        UPDATE accounts
        SET
          access_skope_type = 'provider',
          access_skope_key = ${newProvider.id}::text,
          updated_at = NOW()
        WHERE id = ${newAccount.id}
        RETURNING *
      `;
        return {
          user,
          account: updatedAccount,
          provider: newProvider,
        };
      });
      return NextResponse.json(
        {
          user: result.user,
          account: result.account,
          provider: result.provider,
          message: "Provider account created successfully",
        },
        { status: 201 },
      );
    } catch (error) {
      const err = error as Error;
      if (err.message === "USER_NOT_FOUND") {
        return NextResponse.json(
          {
            error: "User not found",
          },
          { status: 404 },
        );
      }
      if (err.message === "PROVIDER_ACCOUNT_ALREADY_EXISTS") {
        return NextResponse.json(
          {
            error: "This user already has a provider account",
          },
          { status: 409 },
        );
      }
      return NextResponse.json(
        {
          error: "Failed to create provider account",
        },
        { status: 500 },
      );
    }
  },
);
