/**
 * Formatting constants for BreakdownLogger.
 *
 * This module centralises magic values used by LogFormatter
 * for message truncation and data serialization.
 *
 * @module
 */

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
