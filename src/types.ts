/**
 * @fileoverview Core type definitions for the BreakdownLogger.
 *
 * This module defines the fundamental types used throughout the logging system,
 * including log levels, log entries, and configuration enums.
 *
 * @module types
 * @since 1.0.0
 */

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
 * Represents a complete log entry with all metadata and content.
 *
 * This interface defines the structure of a log entry that contains
 * all the information needed to format and output a log message.
 *
 * @interface LogEntry
 * @since 1.0.0
 */
export interface LogEntry {
  /**
   * The exact time when the log entry was created.
   * Used to provide temporal context and ordering of log messages.
   * Format: ISO 8601 timestamp (e.g., "2023-12-01T10:30:45.123Z")
   */
  timestamp: Date;

  /**
   * The severity level of this log entry.
   * Determines whether the message should be displayed based on
   * the current LOG_LEVEL environment variable setting.
   */
  level: LogLevel;

  /**
   * A unique identifier for the logger instance that created this entry.
   * Used for filtering logs by component or module using the LOG_KEY
   * environment variable. Helps isolate logs from specific parts of the system.
   */
  key: string;

  /**
   * The primary log message text.
   * This is the main human-readable content that describes what happened.
   * May be truncated based on LOG_LENGTH environment variable settings.
   */
  message: string;

  /**
   * Optional structured data associated with the log entry.
   * Can contain objects, arrays, or primitive values that provide
   * additional context. Will be serialized to JSON in the output.
   * Use for debugging information, error details, or contextual data.
   */
  data?: unknown;
}
