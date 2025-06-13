import { BreakdownLogger } from "../mod.ts";

/**
 * Basic usage example
 *
 * This sample demonstrates the following features:
 * 1. Default log level (INFO) behavior
 * 2. How to set log level via environment variables
 * 3. Structured data output
 * 4. Using different logger instances
 */

// Initialize logger with default log level (INFO)
const logger = new BreakdownLogger();

// Basic functionality demo
console.log("\n=== Basic Functionality Demo ===");
logger.debug("This message will not be output (DEBUG < INFO)");
logger.info("This message will be output");
logger.warn("This message will be output");
logger.error("This message will be output");

// Structured data output
console.log("\n=== Structured Data Output ===");
const userData = {
  id: 123,
  name: "Test User",
  preferences: {
    theme: "dark",
    notifications: true,
  },
};
logger.info("User information", userData);

// Demo of log level control via environment variables
console.log("\n=== Log Level Control via Environment Variables ===");
console.log("Current log level: INFO (default)");
console.log("To change log level, set the LOG_LEVEL environment variable");
console.log(
  "Example: LOG_LEVEL=debug deno run --allow-env example/basic_usage.ts",
);

// Creating different logger instances
console.log("\n=== Different Logger Instances ===");
const apiLogger = new BreakdownLogger("api");
const dbLogger = new BreakdownLogger("database");

apiLogger.info("API request received", { endpoint: "/users/123" });
dbLogger.info("Database query executed", {
  query: "SELECT * FROM users WHERE id = 123",
});
