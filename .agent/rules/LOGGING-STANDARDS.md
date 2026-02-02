# Logging Standards

## 1. Overview
Logging is split into two distinct channels: **Development/Debug Logs** and **Production Action Logs**.
- **Development Logs:** Ephemeral, high-volume logs used by developers to trace execution flow. They appear in the terminal with color coding.
- **Action Logs:** Durable, high-value logs stored in the database. These represent "Audit Trails" of user activity (e.g., "User X updated Entity Y").

## 2. Key Directories & Files
- **Loggers Root:** `frameworks/next/lib/app-infrastructure/loggers/`
- **Console Implementation:** `frameworks/next/lib/app-infrastructure/loggers/ConsoleLogger.ts`
- **Action Interface:** `frameworks/next/lib/app-infrastructure/loggers/ActionLoggerInterface.ts`
- **Shared Definitions:** `packages/shared/src/utils/logger.ts` (if applicable in future)

## 3. Architecture & Patterns

### The `ConsoleLogger`
- **Format:** `[TIMESTAMP] [LEVEL] Message { metadata }`
- **Levels:** `INFO` (Blue), `WARN` (Yellow), `ERROR` (Red), `DEBUG` (Gray).
- **Usage:** Used primarily during development to verify data flow.

### The `ActionLogger`
- **Purpose:** Security, Auditing, and User History.
- **Storage:** Stored in the `ActionLog` table in Postgres.
- **Trigger:** Business Services invoke this when meaningful state changes occur.

## 4. Agent Rules (Do's and Don'ts)

- **ALWAYS** access the logger via the context: `ctx.log.info(...)`. This ensures the log is tagged with the current Request ID and User ID.
- **NEVER** use `console.log`, `console.error`, or `console.warn` in production code. Use `ConsoleLogger` static methods only if `ctx` is unavailable (e.g., startup scripts).
- **DO** log structured metadata objects, not just strings.
  - *Bad:* `ctx.log.info("User failed login " + email)`
  - *Good:* `ctx.log.info("User failed login", { email, reason: "Invalid Password" })`
- **DO** scrub sensitive fields. Never log raw passwords, credit card numbers, or full refreshing tokens.
- **DO** ensure every `catch` block in a Service/Repository logs the full error stack using `ctx.log.error("Message", error)`.
