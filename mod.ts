/**
 * @module breakdownlogger
 * 
 * A debug logging library for Deno applications, designed for use in test environments.
 * This module provides a simple and flexible logging system that supports different log levels
 * and can be configured through environment variables or programmatically.
 * 
 * @example
 * ```ts
 * import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";
 * 
 * const logger = new BreakdownLogger();
 * logger.info("Application started");
 * logger.debug("Debug information", { someData: "value" });
 * ```
 */

export { BreakdownLogger } from "./src/logger.ts";
export { LogLevel } from "./src/types.ts";
export type { LogEntry, LoggerConfig } from "./src/types.ts";
