/**
 * @module breakdownlogger/logger
 *
 * Core logging functionality for the breakdownlogger package.
 * This module provides the BreakdownLogger class which handles all logging operations
 * with support for different log levels and configurable output formatting.
 *
 * The logger can be configured through environment variables or programmatically:
 * - Environment variable: `LOG_LEVEL` (DEBUG, INFO, WARN, ERROR)
 * - Programmatic configuration: `initialLevel` in LoggerConfig
 *
 * @example
 * ```ts
 * import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger/logger";
 *
 * const logger = new BreakdownLogger({ initialLevel: LogLevel.DEBUG });
 * logger.debug("Detailed debug information");
 * logger.info("General information");
 * logger.warn("Warning message");
 * logger.error("Error occurred", { error: new Error("Something went wrong") });
 * ```
 */

import { LogLevel } from "./types.ts";
import type { LogEntry, LoggerConfig } from "./types.ts";

/**
 * BreakdownLogger class for debugging and logging in test environments
 */
export class BreakdownLogger {
  private currentLogLevel: LogLevel;

  constructor(config?: LoggerConfig) {
    this.currentLogLevel = this.initializeLogLevel(config?.initialLevel);
  }

  /**
   * Initialize log level from environment variable or config
   */
  private initializeLogLevel(configLevel?: LogLevel): LogLevel {
    const envLevel = Deno.env.get("LOG_LEVEL")?.toUpperCase();
    if (envLevel && Object.values(LogLevel).includes(envLevel as LogLevel)) {
      return envLevel as LogLevel;
    }
    return configLevel ?? LogLevel.INFO;
  }

  /**
   * Set the current log level
   */
  public setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  /**
   * Check if the given log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = Object.values(LogLevel);
    const currentIndex = levels.indexOf(this.currentLogLevel);
    const targetIndex = levels.indexOf(level);
    return targetIndex >= currentIndex;
  }

  /**
   * Format a log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    let output = `[${timestamp}] [${entry.level}] ${entry.message}`;

    if (entry.data !== undefined) {
      output += "\nデータ: " + JSON.stringify(entry.data, null, 2);
    }

    return output;
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      data,
    };

    console.log(this.formatLogEntry(entry));
  }

  /**
   * Log debug level message
   */
  public debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Log info level message
   */
  public info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Log warning level message
   */
  public warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Log error level message
   */
  public error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }
}
