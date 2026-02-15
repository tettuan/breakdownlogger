/**
 * Demonstration file
 * This is not an actual test file, but to demonstrate usage of BreakdownLogger.
 * BreakdownLogger only works in test files, so this file is named _test.ts.
 */

import { BreakdownLogger } from "../mod.ts";

/**
 * Advanced usage demonstration
 *
 * This file must be run as a test file:
 * deno test --allow-env example/advanced_usage_test.ts
 */

// Create multiple logger instances with different keys
const authLogger = new BreakdownLogger("auth");
const dbLogger = new BreakdownLogger("database");
const apiLogger = new BreakdownLogger("api");
const cacheLogger = new BreakdownLogger("cache");
const defaultLogger = new BreakdownLogger(); // Default key "default"

Deno.test("Advanced features demonstration", () => {
  console.log("\n=== BreakdownLogger Advanced Usage ===\n");

  // Display environment variable settings
  console.log("Current environment variable settings:");
  console.log(
    `LOG_LEVEL: ${Deno.env.get("LOG_LEVEL") || "Not set (default: info)"}`,
  );
  console.log(
    `LOG_LENGTH: ${
      Deno.env.get("LOG_LENGTH") || "Not set (default: 80 characters)"
    }`,
  );
  console.log(
    `LOG_KEY: ${Deno.env.get("LOG_KEY") || "Not set (output all keys)"}`,
  );
  console.log("\n");

  // 1. Log output with different keys
  console.log("--- Log output with different keys ---");
  authLogger.info("User authentication started");
  authLogger.debug("Verifying authentication token", {
    userId: 12345,
    token: "abc...xyz",
  });

  dbLogger.info("Database connection established");
  dbLogger.debug("Executing query", {
    query: "SELECT * FROM users WHERE id = ?",
    params: [12345],
  });

  apiLogger.info("API call received");
  apiLogger.warn("Approaching rate limit", {
    remaining: 10,
    resetAt: "2024-03-20T13:00:00Z",
  });
  apiLogger.error("External API error occurred", {
    status: 503,
    message: "Service Unavailable",
    endpoint: "https://api.example.com/users",
  });

  cacheLogger.debug("Retrieved from cache", { key: "user:12345", hit: true });

  defaultLogger.info("Log message with default key");

  // 2. Long message truncation demo
  console.log("\n--- Long message truncation demo ---");
  const longMessage =
    "This is a very long message. By default it's truncated at 80 characters, but can be controlled by setting LOG_LENGTH environment variable.";
  const veryLongData = {
    description: "This object contains a lot of data",
    items: Array.from({ length: 20 }, (_, i) => ({
      id: i,
      name: `Item${i}`,
      value: Math.random() * 100,
    })),
  };

  authLogger.info(longMessage);
  dbLogger.debug("Retrieved large amount of data", veryLongData);

  // 3. Different log level output
  console.log("\n--- Different log level output ---");
  apiLogger.debug(
    "Detailed debug information (only shown when LOG_LEVEL=debug)",
  );
  apiLogger.info("General information message (shown by default)");
  apiLogger.warn("Warning message (shown when LOG_LEVEL=warn or lower)");
  apiLogger.error("Error message (always shown)");

  // 4. Actual use case example
  console.log("\n--- Actual use case example ---");

  // Function execution tracking
  function processUser(
    userId: number,
  ): { id: number; name: string; email: string } {
    const logger = new BreakdownLogger("user-processor");

    logger.debug("processUser started", { userId });

    try {
      // Simulate processing
      logger.debug("Fetching user data", { source: "database" });
      const userData = {
        id: userId,
        name: "Test User",
        email: "test@example.com",
      };

      logger.debug("Validating data");
      if (!userData.email) {
        logger.warn("Email address not set", { userId });
      }

      logger.debug("Processing completed", { result: "success" });
      return userData;
    } catch (error) {
      logger.error("Error occurred during processing", {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  processUser(12345);
});

// Explanation of execution examples
console.log("\n=== Execution Examples ===");
console.log("1. Display all logs (debug level, full text):");
console.log(
  "   LOG_LEVEL=debug LOG_LENGTH=W deno test --allow-env example/advanced_usage_test.ts",
);
console.log("\n2. Display specific keys only:");
console.log(
  "   LOG_KEY=auth,api deno test --allow-env example/advanced_usage_test.ts",
);
console.log("\n3. Display errors only:");
console.log(
  "   LOG_LEVEL=error deno test --allow-env example/advanced_usage_test.ts",
);
console.log("\n4. Combination example:");
console.log(
  "   LOG_LEVEL=debug LOG_LENGTH=S LOG_KEY=database,cache deno test --allow-env example/advanced_usage_test.ts",
);
