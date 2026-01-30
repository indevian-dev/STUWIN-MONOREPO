import type { NextRequest } from "next/server";
import type { ApiRouteHandler, ApiHandlerContext } from "@/types/next";
import { withApiHandler } from "@/lib/app-access-control/interceptors";
import { NextResponse } from "next/server";
import {
  cleanPhoneNumber,
  validateAzerbaijanPhone,
} from "@/lib/utils/phoneFormatterUtility";
import { validatePassword } from "@/lib/utils/passwordUtility";

import {
  createUserWithAccount,
  verifyUserExists,
} from "@/lib/app-access-control/authenticators/IdentityAuthenticator";
import { storeAndSendRegistrationOtp } from "@/lib/utils/otpHandlingUtility";
import { OtpType } from "@/lib/utils/otpHandlingUtility";
import { SessionAuthenticator } from "@/lib/app-access-control/authenticators/SessionAuthenticator";
import { CookieAuthenticator } from "@/lib/app-access-control/authenticators/CookieAuthenticator";
import {
  assignAccountScope,
  mapSkopeTypeToDomain,
  type SkopeType,
} from "@/lib/utils/skopeUtility";
import { v4 as uuidv4 } from "uuid";
import { ConsoleLogger } from "@/lib/app-infrastructure/loggers/ConsoleLogger";
import { unifiedApiHandler } from "@/lib/app-access-control/interceptors";
import { users, userCredentials } from "@/lib/app-infrastructure/database/schema";
import { eq } from "drizzle-orm";

export const POST = unifiedApiHandler(
  async (request: NextRequest, { authData, params, db }: any) => {
    try {
      const {
        name, // UI still sends 'name', we map to firstName
        email,
        password,
        confirmPassword,
        phone,
      } = await request.json();
      // Basic required fields validation
      if (
        !name ||
        !email ||
        !password ||
        !confirmPassword ||
        !phone
      ) {
        return NextResponse.json(
          {
            error:
              "Name, email, password, confirmPassword, and phone are required",
            field: "required",
          },
          { status: 400 },
        );
      }
      // Password mismatch validation
      if (password !== confirmPassword) {
        return NextResponse.json(
          {
            error: "Passwords do not match",
            field: "confirmPassword",
          },
          { status: 400 },
        );
      }
      // Comprehensive password validation
      const { isPasswordValid, validatedPassword } = await validatePassword({
        password,
      });
      if (!isPasswordValid || !validatedPassword) {
        return NextResponse.json(
          {
            error: "Please provide a valid password",
            field: "password",
          },
          { status: 400 },
        );
      }
      // Clean and validate phone number
      const cleanedPhone = cleanPhoneNumber(phone);
      const isPhoneValid = validateAzerbaijanPhone(cleanedPhone);
      if (!isPhoneValid) {
        return NextResponse.json(
          {
            error: "Please provide a valid Azerbaijan phone number",
            field: "phone",
          },
          { status: 400 },
        );
      }
      // Check if user already exists using the new utility function
      const {
        existingUser,
        existingUserConflicts,
        error: verifyError,
      } = await verifyUserExists({
        email: email,
        phone: cleanedPhone,
      });
      if (verifyError) {
        return NextResponse.json(
          {
            error: "Failed to verify user existence",
            field: "verification",
          },
          { status: 500 },
        );
      }
      if (existingUserConflicts.emailExists) {
        return NextResponse.json(
          {
            error: "Email already registered",
            field: "email",
          },
          { status: 400 },
        );
      }
      if (existingUserConflicts.phoneExists) {
        return NextResponse.json(
          {
            error: "Phone number already registered",
            field: "phone",
          },
          { status: 400 },
        );
      }
      // createUserWithAccount will hash the password internally
      const { success, createdUser, createdAccount, error } =
        await createUserWithAccount({
          name,
          email,
          password: validatedPassword, // Pass plain password, not hashed
          phone: cleanedPhone,
          fin: undefined,
          studentFin: undefined,
          createProvider: false,
          provider: undefined,
          providerId: undefined,
          providerData: undefined,
        });
      if (!success || !createdUser || !createdAccount) {
        return NextResponse.json(
          {
            error: error || "Failed to create user",
            field: "createUser",
          },
          { status: 400 },
        );
      }
      // Cleanup helper function - delete user and account if registration fails after creation
      const rollbackUserCreation = async () => {
        try {
          // Delete credentials using Drizzle
          await db
            .delete(userCredentials)
            .where(eq(userCredentials.userId, createdUser.id));

          // Then delete user using Drizzle
          await db
            .delete(users)
            .where(eq(users.id, createdUser.id));
        } catch (rollbackError) {
          ConsoleLogger.error(
            "Failed to rollback user creation:",
            rollbackError,
          );
        }
      };
      // Wrap the rest of the registration flow in try-catch for automatic cleanup
      try {
        // Get OTP expiry from env (in seconds) and convert to minutes
        const otpExpireSeconds = parseInt(
          process.env.OTP_EXPIRE_TIME || "1200",
          10,
        ); // Default 20 minutes
        const otpExpireMinutes = Math.ceil(otpExpireSeconds / 60);
        // Send OTP verification codes to both email and phone for new user verification
        const otpResult = await storeAndSendRegistrationOtp({
          accountId: createdAccount.id,
          email: createdUser.email,
          phone: createdUser.phone || undefined,
          type: "email_verification",
          ttlMinutes: otpExpireMinutes,
        });
        if (!otpResult.success) {
          // Log the error but don't fail the registration - user can request verification later
        }
        // NOTE: Workspace setup is deferred to onboarding stage
        // For now, create a temporary workspace context for JWT token generation
        // This will be properly configured during onboarding
        const scope = assignAccountScope({
          id: createdAccount.id,
          isPersonal: true, // Default to personal account
          eduOrganizationId: null,
        });
        const scopeType = scope.scopeType;
        const scopeKey = scope.scopeKey;
        const domain = mapSkopeTypeToDomain(scopeType);
        // Create session in the database (stateful)
        const sessionResult = await SessionAuthenticator.createSession({
          accountId: createdAccount.id,
          sessionsGroupId: uuidv4(),
          ip: request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "0.0.0.0",
          userAgent: request.headers.get("user-agent") || "unknown",
        });

        if (!sessionResult) {
          await rollbackUserCreation();
          return NextResponse.json(
            {
              error: "Failed to create user session. Please try again.",
              field: "session",
            },
            { status: 500 },
          );
        }
        const { sessionId, expireAt } = sessionResult;

        // Create response indicating registration successful but verification required
        const responsePayload = {
          success: true,
          message:
            "Registration successful. Please verify your email and phone to complete registration.",
          user: createdUser,
          account: createdAccount,
          permissions: [], // Empty until onboarding
          session: {
            id: sessionId,
            expires_at: expireAt.toISOString(),
          },
          verificationRequired: true,
          verificationSent: {
            email: otpResult.emailSent,
            sms: otpResult.smsSent,
          },
          ...(process.env.NODE_ENV !== "production" &&
            otpResult.otp && { devCode: otpResult.otp }),
        };
        // Create response
        let response = NextResponse.json(responsePayload, { status: 201 });
        // Set authentication cookies (just like login does)
        const { authCookiesResponse } = CookieAuthenticator.setAuthCookies({
          response: response,
          data: {
            session: sessionId,
            expireAt: expireAt,
          },
        });
        return authCookiesResponse;
      } catch (postCreationError) {
        // If anything fails after user creation, rollback
        ConsoleLogger.error(
          "Post-creation registration error:",
          postCreationError,
        );
        await rollbackUserCreation();
        return NextResponse.json(
          {
            error: "An error occurred during registration. Please try again.",
            field: "registration",
          },
          { status: 500 },
        );
      }
    } catch (error) {
      ConsoleLogger.error("Registration error:", error);
      return NextResponse.json(
        {
          error: "An error occurred during registration",
        },
        { status: 500 },
      );
    }
  },
);


