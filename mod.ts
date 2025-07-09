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

/**
 * Message length configuration options for controlling log output verbosity.
 *
 * The LogLength enum provides predefined options for controlling how long
 * log messages can be before they are truncated. This works in conjunction
 * with the LOG_LENGTH environment variable to customize output formatting.
 *
 * ## Available Options:
 * - **DEFAULT (80 chars)**: Standard length for most use cases
 * - **SHORT (160 chars)**: Longer messages for more detail
 * - **LONG (300 chars)**: Extended messages for comprehensive logging
 * - **WHOLE (unlimited)**: No truncation for complete message output
 *
 * ## Environment Variable Usage:
 * Set `LOG_LENGTH` to control message length:
 * - `LOG_LENGTH=S` → SHORT (160 characters)
 * - `LOG_LENGTH=L` → LONG (300 characters)
 * - `LOG_LENGTH=W` → WHOLE (no truncation)
 * - Omit or set `LOG_LENGTH=DEFAULT` → DEFAULT (80 characters)
 *
 * @example Length Configuration Examples
 * ```bash
 * # Standard length (80 characters)
 * deno test --allow-env
 *
 * # Short messages (160 characters)
 * LOG_LENGTH=S deno test --allow-env
 *
 * # Long messages (300 characters)
 * LOG_LENGTH=L deno test --allow-env
 *
 * # Complete messages (no truncation)
 * LOG_LENGTH=W deno test --allow-env
 * ```
 *
 * @example Programmatic Usage
 * ```ts
 * import { LogLength } from "@tettuan/breakdownlogger";
 *
 * // LogLength enum values
 * console.log(LogLength.DEFAULT);  // "DEFAULT"
 * console.log(LogLength.SHORT);    // "SHORT"
 * console.log(LogLength.LONG);     // "LONG"
 * console.log(LogLength.WHOLE);    // "WHOLE"
 * ```
 *
 * @enum {string}
 * @readonly
 * @since 1.0.0
 */
export { LogLength } from "./src/types.ts";

/**
 * Interface defining the structure of a complete log entry.
 *
 * LogEntry represents a single log message with all its associated metadata
 * including timestamp, severity level, logger key, message content, and
 * optional structured data. This interface is used internally by the
 * formatter and can be useful for understanding the log data structure.
 *
 * ## Properties:
 * - **timestamp**: Exact time when the log was created (Date object)
 * - **level**: Severity level (DEBUG, INFO, WARN, ERROR)
 * - **key**: Logger identifier for filtering and organization
 * - **message**: Human-readable log message text
 * - **data**: Optional structured data (objects, arrays, primitives)
 *
 * @example Log Entry Structure
 * ```ts
 * import { LogEntry, LogLevel } from "@tettuan/breakdownlogger";
 *
 * // Example of what a log entry looks like internally
 * const entry: LogEntry = {
 *   timestamp: new Date(),
 *   level: LogLevel.INFO,
 *   key: "auth-service",
 *   message: "User authentication successful",
 *   data: { userId: 123, method: "OAuth2" }
 * };
 * ```
 *
 * @example Formatted Output
 * ```
 * [INFO] [auth-service] User authentication successful
 * Data: {"userId":123,"method":"OAuth2"}
 * Timestamp: 2023-12-01T10:30:45.123Z
 * ```
 *
 * @interface LogEntry
 * @since 1.0.0
 */
export type { LogEntry } from "./src/types.ts";
