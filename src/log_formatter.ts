/**
 * Log message formatting for BreakdownLogger.
 *
 * This module handles the formatting and presentation of log messages,
 * including timestamp formatting, message truncation, and data serialization.
 * It ensures consistent output format across all log levels and contexts.
 *
 * @module
 */

import { type LogEntry, LogLength, LogLevel } from "./types.ts";

/**
 * Handles formatting and presentation of log messages for BreakdownLogger.
 *
 * This class provides methods to format log entries with timestamps, levels,
 * keys, messages, and data. It also handles message truncation based on
 * configured length limits and safely serializes data objects.
 *
 * @class LogFormatter
 * @since 1.0.0
 */
export class LogFormatter {
  /**
   * Formats a complete log entry into a string representation.
   *
   * Creates a formatted string containing timestamp, log level, key, message,
   * and optional data. The output is truncated to the specified maximum length
   * if necessary.
   *
   * @param entry - The log entry to format
   * @param maxLength - Maximum length for the formatted message (-1 for unlimited)
   * @returns Formatted log message string
   */
  formatLogEntry(entry: LogEntry, maxLength: number): string {
    const { timestamp, level, key, message, data } = entry;
    const formattedTimestamp = timestamp.toISOString();
    const levelStr = LogLevel[level];

    let baseMessage =
      `[${formattedTimestamp}] [${levelStr}] [${key}] ${message}`;

    if (data !== undefined) {
      const dataStr = this.formatData(data);
      baseMessage += `\nData: ${dataStr}`;
    }

    return this.truncateMessage(baseMessage, maxLength);
  }

  /**
   * Truncates a message to the specified maximum length.
   *
   * If the message exceeds the maximum length, it is truncated and "..."
   * is appended to indicate truncation. If maxLength is -1, no truncation
   * is performed (WHOLE length mode).
   *
   * @param message - The message to truncate
   * @param maxLength - Maximum allowed length (-1 for no truncation)
   * @returns Truncated message string
   * @private
   */
  private truncateMessage(message: string, maxLength: number): string {
    if (maxLength === -1) return message; // WHOLE

    if (message.length <= maxLength) {
      return message;
    }

    // Replace last 3 characters with "..."
    return message.substring(0, maxLength - 3) + "...";
  }

  /**
   * Safely formats data objects for log output.
   *
   * Handles various data types including null, undefined, objects, and primitives.
   * For objects, attempts JSON serialization with pretty formatting. Includes
   * error handling for circular references and other serialization issues.
   *
   * @param data - The data to format (can be any type)
   * @returns String representation of the data
   * @private
   */
  private formatData(data: unknown): string {
    try {
      if (data === null) return "null";
      if (data === undefined) return "undefined";

      if (typeof data === "object") {
        return JSON.stringify(data, null, 2);
      }

      return String(data);
    } catch (_e) {
      // If JSON.stringify fails due to circular references, etc.
      return `[Object: ${String(data)}]`;
    }
  }

  /**
   * Converts LogLength enum values to numeric maximum lengths.
   *
   * Maps LogLength configuration values to their corresponding numeric
   * limits for message truncation. Returns -1 for WHOLE length to indicate
   * no truncation should be applied.
   *
   * @param logLength - The LogLength enum value
   * @returns Numeric maximum length (-1 for unlimited)
   */
  getMaxLength(logLength: LogLength): number {
    switch (logLength) {
      case LogLength.DEFAULT:
        return 80;
      case LogLength.SHORT:
        return 160;
      case LogLength.LONG:
        return 300;
      case LogLength.WHOLE:
        return -1;
      default:
        return 80;
    }
  }
}
