/**
 * Available log levels for the logger.
 * Higher values indicate higher severity.
 * 
 * @enum {number}
 * @readonly
 */
export enum LogLevel {
  /** Detailed debug information. Lowest severity. */
  DEBUG = 0,
  /** General informational messages. Default level. */
  INFO = 1,
  /** Warning messages for potentially harmful situations. */
  WARN = 2,
  /** Error messages. Highest severity, always shown. */
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
