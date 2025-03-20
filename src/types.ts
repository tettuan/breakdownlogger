/**
 * Available log levels for the logger
 */
export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: unknown;
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  initialLevel?: LogLevel;
} 