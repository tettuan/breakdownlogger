/**
 * Log output routing for BreakdownLogger.
 *
 * This module handles the final stage of the logging pipeline,
 * routing formatted messages to the appropriate console method
 * based on log level.
 *
 * @module
 */

import { LogLevel } from "./types.ts";

/**
 * Routes formatted log messages to the appropriate console output.
 *
 * Separates the concern of "where to output" from the rest of the
 * logging pipeline. ERROR level messages go to stderr (console.error),
 * all other levels go to stdout (console.log).
 *
 * @since 1.1.3
 */
export class LogOutput {
  /**
   * Writes a formatted log message to the appropriate console stream.
   *
   * @param formatted - The pre-formatted log message string
   * @param level - The log level, used to determine output stream
   */
  write(formatted: string, level: LogLevel): void {
    if (level === LogLevel.ERROR) {
      console.error(formatted);
    } else {
      console.log(formatted);
    }
  }
}
