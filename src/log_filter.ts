/**
 * Log filtering logic for BreakdownLogger.
 *
 * This module provides pure filtering decisions based on log levels
 * and key matching. Test environment detection is handled separately
 * by TestEnvironmentDetector.
 *
 * @module
 */

import type { LogLevel } from "./types.ts";

/**
 * Provides pure log filtering based on level and key criteria.
 *
 * This class contains no side effects or environment detection.
 * It makes simple comparison decisions that determine whether
 * a log message passes the configured filters.
 *
 * @since 1.0.0
 */
export class LogFilter {
  /**
   * Determines if a log message should be output based on level.
   *
   * @param level - The log level of the message being evaluated
   * @param currentLevel - The minimum log level threshold from configuration
   * @returns true if the message level meets or exceeds the threshold
   */
  shouldLog(level: LogLevel, currentLevel: LogLevel): boolean {
    return level >= currentLevel;
  }

  /**
   * Determines if a log key should be output based on the allowed keys filter.
   *
   * @param key - The logger key to check
   * @param allowedKeys - Array of keys that are allowed to output logs
   * @returns true if the key should be output, false if filtered out
   */
  shouldOutputKey(key: string, allowedKeys: string[]): boolean {
    if (allowedKeys.length === 0) {
      return true;
    }
    return allowedKeys.includes(key);
  }
}
