/**
 * Core logger implementation for BreakdownLogger.
 *
 * This module contains the main BreakdownLogger class that provides
 * debug logging functionality exclusively for test environments.
 * The logger automatically detects test contexts and applies security
 * restrictions to prevent usage in production code.
 *
 * @example
 * ```ts
 * import { BreakdownLogger } from "./logger.ts";
 *
 * const logger = new BreakdownLogger("my-module");
 * logger.info("Starting process");
 * logger.debug("Debug details", { data: "value" });
 * ```
 *
 * @module
 */

import { type LogEntry, LogLevel } from "./types.ts";
import { EnvironmentConfig } from "./environment_config.ts";
import { LogFormatter } from "./log_formatter.ts";
import { LogFilter } from "./log_filter.ts";

/**
 * A debug logging utility designed exclusively for test environments.
 * Provides configurable log levels, message filtering, and output formatting.
 *
 * @example
 * ```ts
 * const logger = new BreakdownLogger("auth-module");
 * logger.debug("Starting authentication", { userId: 123 });
 * logger.info("User authenticated successfully");
 * logger.error("Authentication failed", { error: "Invalid token" });
 * ```
 *
 * @remarks
 * This logger only works in test files (*_test.ts, *.test.ts) for security reasons.
 * Configure behavior using environment variables:
 * - LOG_LEVEL: Set minimum log level (debug, info, warn, error)
 * - LOG_LENGTH: Control message length (S=160, L=300, W=whole, default=80)
 * - LOG_KEY: Filter by logger keys (comma/colon/slash separated)
 */
export class BreakdownLogger {
  private readonly key: string;
  private readonly environmentConfig: EnvironmentConfig;
  private readonly formatter: LogFormatter;
  private readonly filter: LogFilter;

  /**
   * Creates a new BreakdownLogger instance.
   *
   * @param key - Identifier for this logger instance. Used for filtering logs.
   *              Defaults to "default" if not specified.
   */
  constructor(key: string = "default") {
    this.key = key;
    this.environmentConfig = EnvironmentConfig.getInstance();
    this.formatter = new LogFormatter();
    this.filter = new LogFilter();
  }

  /**
   * Internal method to handle log output with filtering and formatting.
   *
   * @param level - The log level for this message
   * @param message - The message to log
   * @param data - Optional structured data to include
   * @private
   */
  private log(level: LogLevel, message: string, data?: unknown): void {
    const currentLevel = this.environmentConfig.getLogLevel();

    if (!this.filter.shouldLog(level, currentLevel)) {
      return;
    }

    const allowedKeys = this.environmentConfig.getLogKeys();
    if (!this.filter.shouldOutputKey(this.key, allowedKeys)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      key: this.key,
      message,
      data,
    };

    const logLength = this.environmentConfig.getLogLength();
    const maxLength = this.formatter.getMaxLength(logLength);
    const formattedMessage = this.formatter.formatLogEntry(entry, maxLength);

    if (level === LogLevel.ERROR) {
      console.error(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  /**
   * Logs a debug message. Only shown when LOG_LEVEL=debug.
   *
   * @param message - The message to log
   * @param data - Optional structured data to include
   */
  public debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Logs an info message. Shown by default unless LOG_LEVEL is set higher.
   *
   * @param message - The message to log
   * @param data - Optional structured data to include
   */
  public info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Logs a warning message. Shown when LOG_LEVEL=warn or lower.
   *
   * @param message - The message to log
   * @param data - Optional structured data to include
   */
  public warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Logs an error message. Always shown regardless of LOG_LEVEL.
   * Output goes to stderr instead of stdout.
   *
   * @param message - The message to log
   * @param data - Optional structured data to include
   */
  public error(message: string, data?: unknown): void {
    this.log(LogLevel.ERROR, message, data);
  }
}
