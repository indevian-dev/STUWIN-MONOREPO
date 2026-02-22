export enum LogLevel {
    TRACE = 'TRACE',
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    HTTP = 'HTTP',
    WARN = 'WARN',
    ERROR = 'ERROR',
    FATAL = 'FATAL'
}

export interface LogContext {
    requestId?: string;
    userId?: string;
    accountId?: string;
    path?: string;
    method?: string;
    [key: string]: any;
}

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    requestId?: string;
    userId?: string;
    accountId?: string;
    path?: string;
    method?: string;
    durationMs?: number;
    statusCode?: number;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
    metadata?: Record<string, any>;
}

export interface LoggerInstance {
    child(context: Partial<LogContext>): LoggerInstance;
    trace(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    http(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    fatal(message: string, ...args: any[]): void;
}
