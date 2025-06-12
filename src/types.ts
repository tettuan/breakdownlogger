/**
 * Available log levels for the logger
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * Log length options
 */
export enum LogLength {
  DEFAULT = "DEFAULT",
  SHORT = "SHORT",
  LONG = "LONG",
  WHOLE = "WHOLE",
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  key: string;
  message: string;
  data?: unknown;
}
