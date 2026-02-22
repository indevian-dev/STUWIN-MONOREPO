import type { NextRequest } from 'next/server';
import type { LogLevel, LogContext, LogEntry, LoggerInstance } from '@/lib/logging/Logger.types';
import { LogLevel as LogLevelEnum } from '@/lib/logging/Logger.types';
// ═══════════════════════════════════════════════════════════════
// INLINE COLOR UTILITIES
// ANSI color codes for console output
// ═══════════════════════════════════════════════════════════════

const colors = {
  red: (text: string): string => `\x1b[31m${text}\x1b[0m`,
  green: (text: string): string => `\x1b[32m${text}\x1b[0m`,
  blue: (text: string): string => `\x1b[34m${text}\x1b[0m`,
  yellow: (text: string): string => `\x1b[33m${text}\x1b[0m`,
  magenta: (text: string): string => `\x1b[35m${text}\x1b[0m`,
  cyan: (text: string): string => `\x1b[36m${text}\x1b[0m`,
  white: (text: string): string => `\x1b[37m${text}\x1b[0m`,
  gray: (text: string): string => `\x1b[90m${text}\x1b[0m`,
  black: (text: string): string => `\x1b[30m${text}\x1b[0m`,
  emerald: (text: string): string => `\x1b[38;2;102;212;189m${text}\x1b[0m`,
  orange: (text: string): string => `\x1b[38;2;255;165;0m${text}\x1b[0m`
} as const;

// ═══════════════════════════════════════════════════════════════
// ENTERPRISE LOGGER SERVICE
// Structured logging with request correlation, log levels, and 
// extensible transports (console, file, external services)
// ═══════════════════════════════════════════════════════════════

const LOG_LEVELS: Record<LogLevel, number> = {
  [LogLevelEnum.TRACE]: 0,
  [LogLevelEnum.DEBUG]: 1,
  [LogLevelEnum.INFO]: 2,
  [LogLevelEnum.HTTP]: 3,
  [LogLevelEnum.WARN]: 4,
  [LogLevelEnum.ERROR]: 5,
  [LogLevelEnum.FATAL]: 6
};

const CURRENT_LEVEL = LOG_LEVELS[
  LogLevelEnum[(process.env.LOG_LEVEL || 'INFO').toUpperCase() as keyof typeof LogLevelEnum]
] ?? LOG_LEVELS[LogLevelEnum.INFO];

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Generate a unique request ID for correlation
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Format log entry for structured logging
 */
function formatLogEntry(params: {
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  accountId?: string;
  path?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
  metadata?: Record<string, unknown>;
}): LogEntry {
  const {
    level,
    message,
    requestId,
    userId,
    accountId,
    path,
    method,
    duration,
    statusCode,
    error,
    metadata
  } = params;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(requestId && { requestId }),
    ...(userId && { userId }),
    ...(accountId && { accountId }),
    ...(path && { path }),
    ...(method && { method }),
    ...(duration !== undefined && { durationMs: duration }),
    ...(statusCode && { statusCode }),
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        ...(IS_PRODUCTION ? {} : { stack: error.stack })
      }
    }),
    ...(metadata && Object.keys(metadata).length > 0 && { metadata })
  };

  return entry;
}

/**
 * Console transport with colored output for development
 */
function consoleTransport(entry: LogEntry): void {
  const levelColors: Record<LogLevel, (str: string) => string> = {
    [LogLevelEnum.TRACE]: colors.gray,
    [LogLevelEnum.DEBUG]: colors.gray,
    [LogLevelEnum.INFO]: colors.green,
    [LogLevelEnum.HTTP]: colors.blue,
    [LogLevelEnum.WARN]: colors.yellow,
    [LogLevelEnum.ERROR]: colors.red,
    [LogLevelEnum.FATAL]: colors.red
  };

  const colorFn = levelColors[entry.level] || colors.white;

  if (IS_PRODUCTION) {
    // JSON format for production log aggregation
    console.log(JSON.stringify(entry));
  } else {
    // Pretty format for development
    const prefix = `[${entry.timestamp}] ${colorFn(`[${entry.level}]`)}`;
    const reqId = entry.requestId ? colors.gray(`(${entry.requestId})`) : '';
    const user = entry.userId ? colors.gray(`user:${entry.userId}`) : '';
    const path = entry.path ? (`${entry.method || ''} ${entry.path}`) : '';
    const duration = entry.durationMs !== undefined
      ? colors.gray(`${entry.durationMs}ms`) : '';
    const status = entry.statusCode
      ? (entry.statusCode >= 400 ? colors.red : colors.green)(`[${entry.statusCode}]`) : '';

    console.log(
      `${prefix} ${entry.message}`,
      ...[reqId, user, path, duration, status].filter(Boolean)
    );

    if (entry.error) {
      // Always show error name and message
      console.log(colors.red(`  ${entry.error.name}: ${entry.error.message}`));
      // Show stack trace if available
      if (entry.error.stack) {
        console.log(colors.red(entry.error.stack));
      }
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      console.log(colors.gray('  metadata:'), entry.metadata);
    }
  }
}

/**
 * Logger class with context support
 */
class Logger implements LoggerInstance {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: Partial<LogContext>): Logger {
    return new Logger({ ...this.context, ...additionalContext });
  }

  /**
   * Create a request-scoped logger
   */
  forRequest(request: NextRequest, additionalContext: Partial<LogContext> = {}): Logger {
    const requestId = request.headers?.get?.('x-request-id') || generateRequestId();

    return new Logger({
      ...this.context,
      requestId,
      path: request.nextUrl?.pathname || request.url,
      method: request.method,
      ...additionalContext
    });
  }

  private _log(level: LogLevel, message: string, meta: Record<string, unknown> = {}): void {
    if (LOG_LEVELS[level] < CURRENT_LEVEL) return;

    const entry = formatLogEntry({
      level,
      message,
      ...this.context,
      ...meta
    });

    consoleTransport(entry);

    // Add external transports here (e.g., Datadog, Sentry, etc.)
    // if (IS_PRODUCTION) {
    //   externalTransport(entry);
    // }
  }

  error(message: string, metaOrError?: unknown, metadata?: Record<string, unknown>): void {
    const meta = metaOrError instanceof Error
      ? { error: metaOrError, ...metadata }
      : (metaOrError && typeof metaOrError === 'object' ? metaOrError as Record<string, unknown> : {});
    this._log(LogLevelEnum.ERROR, message, meta);
  }

  fatal(message: string, metaOrError?: unknown, metadata?: Record<string, unknown>): void {
    const meta = metaOrError instanceof Error
      ? { error: metaOrError, ...metadata }
      : (metaOrError && typeof metaOrError === 'object' ? metaOrError as Record<string, unknown> : {});
    this._log(LogLevelEnum.FATAL, message, meta);
  }

  warn(message: string, meta: Record<string, unknown> = {}): void {
    this._log(LogLevelEnum.WARN, message, meta);
  }

  info(message: string, meta: Record<string, unknown> = {}): void {
    this._log(LogLevelEnum.INFO, message, meta);
  }

  http(message: string, meta: Record<string, unknown> = {}): void {
    this._log(LogLevelEnum.HTTP, message, meta);
  }

  debug(message: string, meta: Record<string, unknown> = {}): void {
    this._log(LogLevelEnum.DEBUG, message, meta);
  }

  trace(message: string, meta: Record<string, unknown> = {}): void {
    this._log(LogLevelEnum.TRACE, message, meta);
  }

  /**
   * Log API request completion
   */
  apiComplete({
    statusCode,
    duration,
    success = true,
    metadata
  }: {
    statusCode: number;
    duration: number;
    success?: boolean;
    metadata?: Record<string, unknown>;
  }): void {
    const level: LogLevel = statusCode >= 500 ? LogLevelEnum.ERROR
      : statusCode >= 400 ? LogLevelEnum.WARN
        : LogLevelEnum.HTTP;

    this._log(level, success ? 'Request completed' : 'Request failed', {
      statusCode,
      duration,
      metadata
    });
  }
}

// Default logger instance
const logger = new Logger();

export default logger;

// ═══════════════════════════════════════════════════════════════
// DEPRECATED: SIMPLE LOGGING API
// ═══════════════════════════════════════════════════════════════
// @deprecated Use the structured logger instead:
//   - Instead of: log.success('message')
//   - Use: logger.info('message', { metadata })
//
// This simple log helper bypasses structured logging and should not be used.
// It's kept temporarily for backward compatibility but will be removed.
// ═══════════════════════════════════════════════════════════════

/** @deprecated Use logger.info(), logger.error(), etc. instead for structured logging */
export const log = {
  /** @deprecated Use logger.info() instead */
  success: (msg: string) => console.log(colors.green(`✓ ${msg}`)),
  /** @deprecated Use logger.error() instead */
  error: (msg: string) => console.log(colors.red(`✗ ${msg}`)),
  /** @deprecated Use logger.warn() instead */
  warn: (msg: string) => console.log(colors.yellow(`⚠ ${msg}`)),
  /** @deprecated Use logger.info() instead */
  info: (msg: string) => console.log((msg)),
  /** @deprecated Use logger.debug() instead */
  debug: (msg: string) => console.log(colors.gray(`⚙ ${msg}`))
} as const;

/**
 * Request timing middleware helper
 */
export function createRequestTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}

/**
 * API error codes for consistent error responses
 */
export const ErrorCodes = {
  // Authentication (401)
  NO_TOKEN: 'NO_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  SESSION_INVALID: 'SESSION_INVALID',

  // Authorization (403)
  FORBIDDEN: 'FORBIDDEN',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',

  // Validation (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Not Found (404)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',

  // Conflict (409)
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Rate Limit (429)
  RATE_LIMITED: 'RATE_LIMITED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const;

