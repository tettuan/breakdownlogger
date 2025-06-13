/**
 * Log filtering logic for BreakdownLogger.
 *
 * This module handles filtering of log messages based on log levels,
 * test environment detection, and log key filtering. It ensures that
 * logs are only output in appropriate contexts and at the correct verbosity levels.
 *
 * @module
 */

import type { LogLevel } from "./types.ts";

/**
 * Handles filtering of log messages based on various criteria.
 *
 * This class determines whether log messages should be output based on
 * the current environment (test vs production), log levels, and key filtering.
 * It provides the core security mechanism that prevents logging in production.
 *
 * @since 1.0.0
 */
export class LogFilter {
  private isTestEnvironment: boolean;

  constructor() {
    this.isTestEnvironment = this.checkTestEnvironment();
  }

  /**
   * Determines if a log message should be output based on level and environment.
   *
   * @param level - The log level of the message being evaluated
   * @param currentLevel - The minimum log level threshold from configuration
   * @returns true if the message should be logged, false otherwise
   */
  shouldLog(level: LogLevel, currentLevel: LogLevel): boolean {
    // Always false if not test code
    if (!this.isTestEnvironment) {
      return false;
    }

    // Output only logs at or above current log level
    return level >= currentLevel;
  }

  /**
   * Determines if a log key should be output based on the allowed keys filter.
   *
   * @param key - The logger key to check
   * @param allowedKeys - Array of keys that are allowed to output logs (from LOG_KEY env var)
   * @returns true if the key should be output, false if filtered out
   */
  shouldOutputKey(key: string, allowedKeys: string[]): boolean {
    // Output all if KEY is not specified
    if (allowedKeys.length === 0) {
      return true;
    }

    // Check if included in specified KEY
    return allowedKeys.includes(key);
  }

  /**
   * Checks if the current execution context is within a test environment.
   *
   * Uses stack trace analysis and environment variables to determine if
   * the logger is being called from test code. This is the core security
   * mechanism that prevents logging in production environments.
   *
   * @returns true if running in a test environment, false otherwise
   * @private
   */
  private checkTestEnvironment(): boolean {
    // Check if in Deno.test context
    // In Deno test context, stack trace contains specific patterns
    const stack = new Error().stack;
    if (!stack) return false;

    // Check if Deno test runner is included
    const isDenoTest = stack.includes("ext:cli/40_test.js") ||
      stack.includes("$deno$test$") ||
      stack.includes("TestContext") ||
      stack.includes("ext:deno_test/") || // Test runner in CI environment
      stack.includes("deno:test") || // Alternative test runner pattern
      stack.includes("test.ts") || // Deno test files in CI
      stack.includes("test_runner"); // Generic test runner pattern

    // Check test file patterns
    const hasTestPattern = stack.includes("_test.ts") ||
      stack.includes("_test.js") ||
      stack.includes("_test.mjs") ||
      stack.includes("_test.jsx") ||
      stack.includes("_test.tsx") ||
      stack.includes(".test.ts") ||
      stack.includes(".test.js") ||
      stack.includes("_test.") || // Broader pattern
      stack.includes(".test."); // Broader pattern

    // Force test mode via environment variable (for debugging)
    const forceTestMode = Deno.env.get("FORCE_TEST_MODE") === "true";

    return isDenoTest || hasTestPattern || forceTestMode;
  }
}
