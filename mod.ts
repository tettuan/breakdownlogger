/**
 * @module breakdownlogger
 *
 * A debug logging library for Deno applications, designed for use in test environments.
 * This module provides a simple and flexible logging system that supports different log levels
 * and can be configured through environment variables.
 *
 * @example
 * ```ts
 * import { BreakdownLogger } from "@tettuan/breakdownlogger";
 *
 * const logger = new BreakdownLogger("config-loader-001");
 * logger.info("Application started");
 * logger.debug("Debug information", { someData: "value" });
 * ```
 */

export { BreakdownLogger } from "./src/logger.ts";
export { LogLevel } from "./src/types.ts";
