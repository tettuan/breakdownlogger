/**
 * @fileoverview Environment configuration management for BreakdownLogger.
 *
 * This module handles parsing and caching of environment variables that control
 * logging behavior. It implements a singleton pattern to ensure consistent
 * configuration across the application while providing methods to reset when needed.
 *
 * @module environment_config
 * @since 1.0.0
 */

import { LogLength, LogLevel } from "./types.ts";

/**
 * Manages environment variable configuration for BreakdownLogger.
 *
 * This class implements a singleton pattern to ensure consistent configuration
 * parsing and caching across the entire application. It handles parsing of
 * LOG_LEVEL, LOG_LENGTH, and LOG_KEY environment variables with appropriate
 * defaults and validation.
 *
 * @class EnvironmentConfig
 * @since 1.0.0
 */
export class EnvironmentConfig {
  private static instance: EnvironmentConfig | null = null;
  private logLevel: LogLevel;
  private logLength: LogLength;
  private logKeys: string[];

  private constructor() {
    this.logLevel = this.parseLogLevel();
    this.logLength = this.parseLogLength();
    this.logKeys = this.parseLogKeys();
  }

  /**
   * Gets the singleton instance of EnvironmentConfig.
   *
   * Creates a new instance if one doesn't exist, otherwise returns
   * the existing cached instance. This ensures consistent configuration
   * across the entire application.
   *
   * @returns The singleton EnvironmentConfig instance
   * @static
   */
  static getInstance(): EnvironmentConfig {
    if (!this.instance) {
      this.instance = new EnvironmentConfig();
    }
    return this.instance;
  }

  /**
   * Resets the singleton instance, forcing re-parsing of environment variables.
   *
   * This method is primarily used in testing scenarios where environment
   * variables may change between tests and the singleton needs to be
   * re-initialized with new values.
   *
   * @static
   */
  static reset(): void {
    this.instance = null;
  }

  /**
   * Gets the current log level setting from environment configuration.
   *
   * @returns The configured log level (defaults to INFO if not set)
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Gets the current log length setting from environment configuration.
   *
   * @returns The configured log length limit (defaults to DEFAULT if not set)
   */
  getLogLength(): LogLength {
    return this.logLength;
  }

  /**
   * Gets the current log key filters from environment configuration.
   *
   * @returns Array of allowed log keys (empty array means all keys allowed)
   */
  getLogKeys(): string[] {
    return this.logKeys;
  }

  /**
   * Parses the LOG_LEVEL environment variable into a LogLevel enum value.
   *
   * Supports case-insensitive parsing of "debug", "info", "warn", and "error".
   * Defaults to INFO level if the environment variable is not set or invalid.
   *
   * @returns The parsed LogLevel value
   * @private
   */
  private parseLogLevel(): LogLevel {
    const level = Deno.env.get("LOG_LEVEL")?.toLowerCase();
    switch (level) {
      case "debug":
        return LogLevel.DEBUG;
      case "info":
        return LogLevel.INFO;
      case "warn":
        return LogLevel.WARN;
      case "error":
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  /**
   * Parses the LOG_LENGTH environment variable into a LogLength enum value.
   *
   * Supports case-insensitive parsing of "S" (short), "L" (long), and "W" (whole).
   * Defaults to DEFAULT (30 characters) if the environment variable is not set or invalid.
   *
   * @returns The parsed LogLength value
   * @private
   */
  private parseLogLength(): LogLength {
    const length = Deno.env.get("LOG_LENGTH")?.toUpperCase();
    switch (length) {
      case "S":
        return LogLength.SHORT;
      case "L":
        return LogLength.LONG;
      case "W":
        return LogLength.WHOLE;
      default:
        return LogLength.DEFAULT;
    }
  }

  /**
   * Parses the LOG_KEY environment variable into an array of allowed keys.
   *
   * Supports multiple separators: comma (,), colon (:), and slash (/).
   * Filters out empty strings and trims whitespace from each key.
   * Returns empty array if LOG_KEY is not set, which allows all keys to log.
   *
   * @returns Array of allowed logger key strings
   * @private
   */
  private parseLogKeys(): string[] {
    const keys = Deno.env.get("LOG_KEY");
    if (!keys) return [];

    // 区切り文字: カンマ、コロン、スラッシュのいずれか
    const separators = /[,:\/]/;
    return keys.split(separators).filter((key) => key.trim().length > 0);
  }
}
