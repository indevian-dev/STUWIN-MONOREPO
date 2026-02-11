// ═══════════════════════════════════════════════════════════════
// CENTRALIZED CONSOLE LOGGER
// Colored console outputs with development mode control
// ═══════════════════════════════════════════════════════════════

// Color functions for console output
const red = (text: string): string => `\x1b[31m${text}\x1b[0m`;
const green = (text: string): string => `\x1b[32m${text}\x1b[0m`;
const blue = (text: string): string => `\x1b[34m${text}\x1b[0m`;
const yellow = (text: string): string => `\x1b[33m${text}\x1b[0m`;
const magenta = (text: string): string => `\x1b[35m${text}\x1b[0m`;
const cyan = (text: string): string => `\x1b[36m${text}\x1b[0m`;
const white = (text: string): string => `\x1b[37m${text}\x1b[0m`;
const gray = (text: string): string => `\x1b[90m${text}\x1b[0m`;
const black = (text: string): string => `\x1b[30m${text}\x1b[0m`;
const emerald = (text: string): string => `\x1b[38;2;102;212;189m${text}\x1b[0m`;
const orange = (text: string): string => `\x1b[38;2;255;165;0m${text}\x1b[0m`;

const IS_DEV = process.env.NODE_ENV === 'development';
const IS_TEST = process.env.NODE_ENV === 'test';

// Control console output via environment variable
const CONSOLE_ENABLED = process.env.CONSOLE_LOGS !== 'false';

// Should we print console logs?
const shouldLog = IS_DEV && CONSOLE_ENABLED;

/**
 * Centralized Console Logger
 * 
 * Features:
 * - Colored output for better readability
 * - Only logs in development mode by default
 * - Can be disabled via CONSOLE_LOGS=false env var
 * - Consistent format across the application
 * 
 * Usage:
 * ```typescript
 * import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
 * 
 * ConsoleLogger.log('Regular message');
 * ConsoleLogger.info('Info message');
 * ConsoleLogger.success('Success message');
 * ConsoleLogger.warn('Warning message');
 * ConsoleLogger.error('Error message');
 * ConsoleLogger.debug('Debug message');
 * ```
 */

interface ConsoleLoggerInterface {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  success: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  trace: (...args: any[]) => void;
  group: (label?: string) => void;
  groupEnd: () => void;
  table: (data: any) => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
}

// Internal console reference (native console)
const nativeConsole = globalThis.console;

/**
 * Format timestamp for console output
 */
function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
}

/**
 * Centralized console logger with colors and dev-mode control
 */
export const ConsoleLogger: ConsoleLoggerInterface = {
  /**
   * Regular log (white/default color)
   */
  log: (...args: any[]) => {
    if (!shouldLog) return;
    const timestamp = gray(`[${getTimestamp()}]`);
    nativeConsole.log(timestamp, ...args);
  },

  /**
   * Info log (blue)
   */
  info: (...args: any[]) => {
    if (!shouldLog) return;
    const timestamp = gray(`[${getTimestamp()}]`);
    const prefix = blue('ℹ INFO:');
    nativeConsole.log(timestamp, prefix, ...args);
  },

  /**
   * Success log (green with checkmark)
   */
  success: (...args: any[]) => {
    if (!shouldLog) return;
    const timestamp = gray(`[${getTimestamp()}]`);
    const prefix = green('✓ SUCCESS:');
    nativeConsole.log(timestamp, prefix, ...args);
  },

  /**
   * Warning log (yellow with warning symbol)
   */
  warn: (...args: any[]) => {
    if (!shouldLog) return;
    const timestamp = gray(`[${getTimestamp()}]`);
    const prefix = yellow('⚠ WARNING:');
    nativeConsole.warn(timestamp, prefix, ...args);
  },

  /**
   * Error log (red with X symbol)
   * Note: Still logs in production for critical errors
   */
  error: (...args: any[]) => {
    if (!shouldLog && !IS_TEST) {
      // In production, still log errors but without colors
      nativeConsole.error(...args);
      return;
    }
    const timestamp = gray(`[${getTimestamp()}]`);
    const prefix = red('✗ ERROR:');
    nativeConsole.error(timestamp, prefix, ...args);
  },

  /**
   * Debug log (gray with gear symbol)
   */
  debug: (...args: any[]) => {
    if (!shouldLog) return;
    const timestamp = gray(`[${getTimestamp()}]`);
    const prefix = gray('⚙ DEBUG:');
    nativeConsole.log(timestamp, prefix, ...args);
  },

  /**
   * Trace log (gray with detailed stack trace)
   */
  trace: (...args: any[]) => {
    if (!shouldLog) return;
    const timestamp = gray(`[${getTimestamp()}]`);
    const prefix = gray('⚡ TRACE:');
    nativeConsole.log(timestamp, prefix, ...args);
    nativeConsole.trace();
  },

  /**
   * Group logs together
   */
  group: (label?: string) => {
    if (!shouldLog) return;
    if (label) {
      const timestamp = gray(`[${getTimestamp()}]`);
      nativeConsole.group(timestamp, cyan(`▼ ${label}`));
    } else {
      nativeConsole.group();
    }
  },

  /**
   * End log group
   */
  groupEnd: () => {
    if (!shouldLog) return;
    nativeConsole.groupEnd();
  },

  /**
   * Display data in table format
   */
  table: (data: any) => {
    if (!shouldLog) return;
    nativeConsole.table(data);
  },

  /**
   * Start a timer
   */
  time: (label: string) => {
    if (!shouldLog) return;
    nativeConsole.time(cyan(label));
  },

  /**
   * End a timer and log duration
   */
  timeEnd: (label: string) => {
    if (!shouldLog) return;
    nativeConsole.timeEnd(cyan(label));
  },
};

/**
 * Create a namespaced logger for specific modules
 * 
 * Usage:
 * ```typescript
 * const log = createLogger('AuthService');
 * log.info('User logged in');  // [10:30:45] [AuthService] ℹ INFO: User logged in
 * ```
 */
export function createLogger(namespace: string): ConsoleLoggerInterface {
  const namespacedPrefix = magenta(`[${namespace}]`);

  return {
    log: (...args: any[]) => ConsoleLogger.log(namespacedPrefix, ...args),
    info: (...args: any[]) => {
      if (!shouldLog) return;
      const timestamp = gray(`[${getTimestamp()}]`);
      const prefix = blue('ℹ INFO:');
      nativeConsole.log(timestamp, namespacedPrefix, prefix, ...args);
    },
    success: (...args: any[]) => {
      if (!shouldLog) return;
      const timestamp = gray(`[${getTimestamp()}]`);
      const prefix = green('✓ SUCCESS:');
      nativeConsole.log(timestamp, namespacedPrefix, prefix, ...args);
    },
    warn: (...args: any[]) => {
      if (!shouldLog) return;
      const timestamp = gray(`[${getTimestamp()}]`);
      const prefix = yellow('⚠ WARNING:');
      nativeConsole.warn(timestamp, namespacedPrefix, prefix, ...args);
    },
    error: (...args: any[]) => {
      if (!shouldLog && !IS_TEST) {
        nativeConsole.error(`[${namespace}]`, ...args);
        return;
      }
      const timestamp = gray(`[${getTimestamp()}]`);
      const prefix = red('✗ ERROR:');
      nativeConsole.error(timestamp, namespacedPrefix, prefix, ...args);
    },
    debug: (...args: any[]) => {
      if (!shouldLog) return;
      const timestamp = gray(`[${getTimestamp()}]`);
      const prefix = gray('⚙ DEBUG:');
      nativeConsole.log(timestamp, namespacedPrefix, prefix, ...args);
    },
    trace: (...args: any[]) => {
      if (!shouldLog) return;
      const timestamp = gray(`[${getTimestamp()}]`);
      const prefix = gray('⚡ TRACE:');
      nativeConsole.log(timestamp, namespacedPrefix, prefix, ...args);
      nativeConsole.trace();
    },
    group: (label?: string) => {
      if (!shouldLog) return;
      const timestamp = gray(`[${getTimestamp()}]`);
      const fullLabel = label ? `${namespace} - ${label}` : namespace;
      nativeConsole.group(timestamp, cyan(`▼ ${fullLabel}`));
    },
    groupEnd: () => ConsoleLogger.groupEnd(),
    table: (data: any) => ConsoleLogger.table(data),
    time: (label: string) => ConsoleLogger.time(`${namespace}:${label}`),
    timeEnd: (label: string) => ConsoleLogger.timeEnd(`${namespace}:${label}`),
  };
}

/**
 * Development-only console (never logs in production)
 */
export const devConsole: ConsoleLoggerInterface = {
  log: (...args: any[]) => IS_DEV && ConsoleLogger.log(...args),
  info: (...args: any[]) => IS_DEV && ConsoleLogger.info(...args),
  success: (...args: any[]) => IS_DEV && ConsoleLogger.log(...args),
  warn: (...args: any[]) => IS_DEV && ConsoleLogger.warn(...args),
  error: (...args: any[]) => IS_DEV && ConsoleLogger.error(...args),
  debug: (...args: any[]) => IS_DEV && ConsoleLogger.debug(...args),
  trace: (...args: any[]) => IS_DEV && ConsoleLogger.trace(...args),
  group: (label?: string) => IS_DEV && ConsoleLogger.group(label),
  groupEnd: () => IS_DEV && ConsoleLogger.groupEnd(),
  table: (data: any) => IS_DEV && ConsoleLogger.table(data),
  time: (label: string) => IS_DEV && ConsoleLogger.time(label),
  timeEnd: (label: string) => IS_DEV && ConsoleLogger.timeEnd(label),
};

// Re-export for convenience
export default ConsoleLogger;
