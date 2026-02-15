/**
 * Shared constants for BreakdownLogger.
 *
 * This module centralises magic values that were previously scattered across
 * log_filter.ts and log_formatter.ts, making them easier to discover, test,
 * and maintain.
 *
 * @module
 */

// ---------------------------------------------------------------------------
// Stack-trace / test-environment detection  (used by LogFilter)
// ---------------------------------------------------------------------------

/** Stack trace patterns indicating Deno test runner execution */
export const DENO_TEST_PATTERNS: readonly string[] = [
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
export const FORCE_TEST_MODE_ENV = "FORCE_TEST_MODE";

// ---------------------------------------------------------------------------
// Message formatting  (used by LogFormatter)
// ---------------------------------------------------------------------------

/** Maximum message lengths for each LogLength setting */
export const MAX_LENGTHS: Readonly<Record<string, number>> = {
  DEFAULT: 80,
  SHORT: 160,
  LONG: 300,
  WHOLE: -1,
};

/** Value indicating no truncation (WHOLE mode) */
export const NO_TRUNCATION = -1;

/** Suffix appended to truncated messages */
export const TRUNCATION_SUFFIX = "...";

/** Number of characters reserved for truncation suffix */
export const TRUNCATION_SUFFIX_LENGTH = 3;

/** JSON indentation spaces for data formatting */
export const JSON_INDENT = 2;
