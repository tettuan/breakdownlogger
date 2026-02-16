/**
 * Test environment detection for BreakdownLogger.
 *
 * This module determines whether code is executing in a test context
 * by analyzing stack traces, file patterns, and environment variables.
 * This is the core security mechanism that prevents logging in production.
 *
 * @module
 */

/** Stack trace patterns indicating Deno test runner execution */
const DENO_TEST_PATTERNS: readonly string[] = [
  "ext:cli/40_test.js",
  "$deno$test$",
  "TestContext",
  "ext:deno_test/",
  "deno:test",
  "test.ts",
  "test_runner",
];

/** File name patterns indicating test files */
export const TEST_FILE_PATTERNS: readonly string[] = [
  "_test.ts",
  "_test.js",
  "_test.mjs",
  "_test.jsx",
  "_test.tsx",
  ".test.ts",
  ".test.js",
  "_test.",
  ".test.",
];

/** Environment variable name for forcing test mode */
const FORCE_TEST_MODE_ENV = "FORCE_TEST_MODE";

/**
 * Detects whether code is executing in a test environment.
 *
 * Uses stack trace analysis, file name patterns, and environment variables
 * to determine the execution context. This is the core security gate
 * that prevents BreakdownLogger from outputting in production.
 *
 * @since 1.1.3
 */
export class TestEnvironmentDetector {
  private readonly testEnvironment: boolean;

  constructor() {
    this.testEnvironment = this.detect();
  }

  /**
   * Returns whether the current context is a test environment.
   *
   * @returns true if running in a test environment, false otherwise
   */
  isTestEnvironment(): boolean {
    return this.testEnvironment;
  }

  /**
   * Performs the actual test environment detection.
   *
   * Checks three layers:
   * 1. Deno test runner patterns in stack trace
   * 2. Test file name patterns in stack trace
   * 3. FORCE_TEST_MODE environment variable override
   *
   * @returns true if any detection layer matches
   * @private
   */
  private detect(): boolean {
    const stack = new Error().stack;
    if (!stack) return false;

    const isDenoTest = DENO_TEST_PATTERNS.some((p) => stack.includes(p));
    const hasTestPattern = TEST_FILE_PATTERNS.some((p) => stack.includes(p));
    const forceTestMode = Deno.env.get(FORCE_TEST_MODE_ENV) === "true";

    return isDenoTest || hasTestPattern || forceTestMode;
  }
}
