/**
 * @fileoverview Log filtering logic for BreakdownLogger.
 *
 * This module handles filtering of log messages based on log levels,
 * test environment detection, and log key filtering. It ensures that
 * logs are only output in appropriate contexts and at the correct verbosity levels.
 *
 * @module log_filter
 * @since 1.0.0
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
    // テストコードでない場合は常にfalse
    if (!this.isTestEnvironment) {
      return false;
    }

    // 現在のログレベル以上のものだけ出力
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
    // KEYが指定されていない場合は全て出力
    if (allowedKeys.length === 0) {
      return true;
    }

    // 指定されたKEYに含まれているかチェック
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
    // Deno.testコンテキストかどうかをチェック
    // Denoテストコンテキストでは、スタックトレースに特定のパターンが含まれる
    const stack = new Error().stack;
    if (!stack) return false;

    // Denoのテストランナーが含まれているかチェック
    const isDenoTest = stack.includes("ext:cli/40_test.js") ||
      stack.includes("$deno$test$") ||
      stack.includes("TestContext") ||
      stack.includes("ext:deno_test/") || // CI環境でのテストランナー
      stack.includes("deno:test") || // 別のテストランナーパターン
      stack.includes("test.ts") || // Deno test files in CI
      stack.includes("test_runner"); // Generic test runner pattern

    // テストファイルパターンをチェック
    const hasTestPattern = stack.includes("_test.ts") ||
      stack.includes("_test.js") ||
      stack.includes("_test.mjs") ||
      stack.includes("_test.jsx") ||
      stack.includes("_test.tsx") ||
      stack.includes(".test.ts") ||
      stack.includes(".test.js") ||
      stack.includes("_test.") || // より広範なパターン
      stack.includes(".test."); // より広範なパターン

    // 環境変数による強制テストモード（デバッグ用）
    const forceTestMode = Deno.env.get("FORCE_TEST_MODE") === "true";

    return isDenoTest || hasTestPattern || forceTestMode;
  }
}
