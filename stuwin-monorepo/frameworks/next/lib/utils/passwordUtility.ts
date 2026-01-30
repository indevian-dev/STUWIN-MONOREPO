"use server";

import type {
  PasswordValidationResult,
  HashPasswordResult,
  VerifyPasswordResult,
} from "@/types/auth/password";

import { ConsoleLogger } from "@/lib/app-infrastructure/loggers/ConsoleLogger";

export async function validatePassword({
  password,
}: {
  password: string;
}): Promise<PasswordValidationResult> {
  const errors: string[] = [];

  if (!password || password.length === 0) {
    errors.push("Password is required");
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
  }

  return {
    isValid: errors.length === 0,
    isPasswordValid: errors.length === 0,
    validatedPassword: errors.length === 0 ? password : null,
    errors: errors,
    score: errors.length === 0 ? 100 : 0,
  };
}

export async function hashPassword({
  password,
}: {
  password: string;
}): Promise<{
  hashedPassword: string;
}> {
  // Dynamic import ensures argon2 is only loaded on server
  const argon2 = await import("argon2");

  const hashedPassword = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 16384,
    timeCost: 3,
    parallelism: 2,
  });

  return { hashedPassword };
}

export async function verifyPassword({
  inputPassword,
  storedPassword,
}: {
  inputPassword: string;
  storedPassword: string;
}): Promise<{
  isPasswordValid: boolean;
}> {
  try {
    if (!inputPassword) {
      ConsoleLogger.error("verifyPassword: Input password is empty");
      return { isPasswordValid: false };
    }

    if (!storedPassword) {
      ConsoleLogger.error("verifyPassword: Stored password hash is empty");
      return { isPasswordValid: false };
    }

    // Trim stored password hash to handle any database-induced whitespace
    const trimmedStoredPassword = storedPassword.trim();

    // Debug: Log password details
    ConsoleLogger.log(
      "verifyPassword: Input password length:",
      inputPassword.length,
    );
    ConsoleLogger.log(
      "verifyPassword: Stored hash length:",
      trimmedStoredPassword.length,
    );
    ConsoleLogger.log(
      `verifyPassword: Stored hash prefix:`,
      trimmedStoredPassword.substring(0, 20),
    );
    ConsoleLogger.log(
      `verifyPassword: Hash algorithm:`,
      trimmedStoredPassword.split("$")[1],
    );

    // Verify that stored password looks like an Argon2 hash
    if (!trimmedStoredPassword.startsWith("$argon2")) {
      ConsoleLogger.error(
        "verifyPassword: Stored password is not a valid Argon2 hash",
      );
      return { isPasswordValid: false };
    }

    // Dynamic import ensures argon2 is only loaded on server
    const argon2 = await import("argon2");
    const isPasswordValid = await argon2.verify(trimmedStoredPassword, inputPassword);

    if (!isPasswordValid) {
      ConsoleLogger.log(`verifyPassword: Password does not match hash`);
      ConsoleLogger.log(
        `verifyPassword: Attempting to re-hash input password for comparison...`,
      );

      // Re-hash the input password to compare format
      const testHash = await argon2.hash(inputPassword, {
        type: argon2.argon2id,
        memoryCost: 16384,
        timeCost: 3,
        parallelism: 2,
      });
      ConsoleLogger.log(
        "verifyPassword: New hash would be:",
        testHash.substring(0, 50),
      );
    } else {
      ConsoleLogger.log(`verifyPassword: Password matched successfully`);
    }

    return { isPasswordValid };
  } catch (error) {
    const err = error as Error;
    ConsoleLogger.error(
      "verifyPassword: Argon2 verification error:",
      err.message,
    );
    return { isPasswordValid: false };
  }
}
