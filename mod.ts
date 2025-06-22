/**
 * @module breakdownlogger
 *
 * A debug logging library for Deno applications, designed for use in test environments.
 * This module provides a simple and flexible logging system that supports different log levels
 * and can be configured through environment variables.
 *
 * @example Basic Usage
 * ```ts
 * import { BreakdownLogger } from "@tettuan/breakdownlogger";
 *
 * const logger = new BreakdownLogger("config-loader-001");
 * logger.info("Application started");
 * logger.debug("Debug information", { someData: "value" });
 * ```
 *
 * @example Environment Configuration
 * ```bash
 * # Set log level to debug
 * export LOG_LEVEL=debug
 *
 * # Control message length (S=160, L=300, W=whole, default=80)
 * export LOG_LENGTH=L
 *
 * # Filter by specific logger keys
 * export LOG_KEY=auth,config
 * ```
 *
 * @example Advanced Usage with Multiple Loggers
 * ```ts
 * import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";
 *
 * const authLogger = new BreakdownLogger("auth");
 * const dbLogger = new BreakdownLogger("database");
 *
 * authLogger.info("User login attempt", { userId: 123 });
 * dbLogger.debug("Query executed", { query: "SELECT * FROM users" });
 * authLogger.error("Authentication failed", { error: "Invalid credentials" });
 * ```
 */

/**
 * A debug logging utility designed exclusively for test environments.
 *
 * The BreakdownLogger provides structured logging with configurable levels,
 * message filtering, and output formatting. It automatically detects test
 * contexts and applies security restrictions to prevent usage in production.
 *
 * ## Key Features:
 * - **Test-only execution**: Only works in test files (*_test.ts, *.test.ts)
 * - **Configurable log levels**: debug, info, warn, error
 * - **Message length control**: Customizable output truncation
 * - **Key-based filtering**: Filter logs by logger identifier
 * - **Structured data support**: JSON serialization of complex objects
 * - **Environment variable configuration**: Zero-code configuration
 *
 * ## Environment Variables:
 * - `LOG_LEVEL`: Set minimum log level (debug, info, warn, error)
 * - `LOG_LENGTH`: Control message length (S=160, L=300, W=whole, default=80)
 * - `LOG_KEY`: Filter by logger keys (comma/colon/slash separated)
 *
 * @example Creating and Using a Logger
 * ```ts
 * import { BreakdownLogger } from "@tettuan/breakdownlogger";
 *
 * const logger = new BreakdownLogger("my-component");
 *
 * // Different log levels
 * logger.debug("Detailed debugging info", { state: "processing" });
 * logger.info("General information", { progress: 50 });
 * logger.warn("Potential issue detected", { retries: 3 });
 * logger.error("Operation failed", { error: "Network timeout" });
 * ```
 *
 * @example Test Environment Setup
 * ```bash
 * # Run tests with debug logging
 * LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read
 *
 * # Filter to specific components only
 * LOG_KEY=auth,database deno test --allow-env
 *
 * # Use longer message format
 * LOG_LENGTH=L LOG_LEVEL=debug deno test --allow-env
 * ```
 */
export { BreakdownLogger } from "./src/logger.ts";

/**
 * Enumeration of available log levels for the BreakdownLogger.
 *
 * Log levels determine which messages are displayed based on their severity.
 * Higher numeric values indicate higher severity. The logger will display
 * messages at or above the configured level.
 *
 * ## Level Hierarchy:
 * - **DEBUG (0)**: Detailed diagnostic information
 * - **INFO (1)**: General informational messages (default)
 * - **WARN (2)**: Warning messages for potentially harmful situations
 * - **ERROR (3)**: Error messages (always shown)
 *
 * ## Usage with Environment Variables:
 * Set `LOG_LEVEL` to control which messages appear:
 * - `LOG_LEVEL=debug`: Shows all messages (DEBUG, INFO, WARN, ERROR)
 * - `LOG_LEVEL=info`: Shows INFO, WARN, ERROR (default behavior)
 * - `LOG_LEVEL=warn`: Shows only WARN and ERROR
 * - `LOG_LEVEL=error`: Shows only ERROR messages
 *
 * @example Using LogLevel for Configuration
 * ```ts
 * import { LogLevel } from "@tettuan/breakdownlogger";
 *
 * // LogLevel enum values
 * console.log(LogLevel.DEBUG);  // 0
 * console.log(LogLevel.INFO);   // 1
 * console.log(LogLevel.WARN);   // 2
 * console.log(LogLevel.ERROR);  // 3
 * ```
 *
 * @example Runtime Level Checking
 * ```bash
 * # Only show warnings and errors
 * LOG_LEVEL=warn deno test
 *
 * # Show all debug information
 * LOG_LEVEL=debug deno test
 *
 * # Show only errors (minimal output)
 * LOG_LEVEL=error deno test
 * ```
 *
 * @enum {number}
 * @readonly
 */
export { LogLevel } from "./src/types.ts";
