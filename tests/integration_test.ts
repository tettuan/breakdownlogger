import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.219.0/assert/mod.ts";
import { BreakdownLogger } from "../mod.ts";

/**
 * Integration tests for BreakdownLogger
 * These tests verify the complete functionality from end to end
 */

// Test utility: Enhanced console capture
class IntegrationConsoleCapture {
  private originalLog: typeof console.log;
  private originalError: typeof console.error;
  private originalWarn: typeof console.warn;
  private originalDebug: typeof console.debug;

  public logs: string[] = [];
  public errors: string[] = [];
  public warns: string[] = [];
  public debugs: string[] = [];

  constructor() {
    this.originalLog = console.log;
    this.originalError = console.error;
    this.originalWarn = console.warn;
    this.originalDebug = console.debug;
  }

  start() {
    console.log = (message: string) => this.logs.push(message);
    console.error = (message: string) => this.errors.push(message);
    console.warn = (message: string) => this.warns.push(message);
    console.debug = (message: string) => this.debugs.push(message);
  }

  stop() {
    console.log = this.originalLog;
    console.error = this.originalError;
    console.warn = this.originalWarn;
    console.debug = this.originalDebug;
  }

  clear() {
    this.logs = [];
    this.errors = [];
    this.warns = [];
    this.debugs = [];
  }

  getAllOutput(): string[] {
    return [...this.logs, ...this.errors, ...this.warns, ...this.debugs];
  }
}

Deno.test("BreakdownLogger - Integration Tests", async (t) => {
  const capture = new IntegrationConsoleCapture();

  // Store original environment values
  const originalLogLevel = Deno.env.get("LOG_LEVEL");
  const originalLogLength = Deno.env.get("LOG_LENGTH");
  const originalLogKey = Deno.env.get("LOG_KEY");
  const originalForceTestMode = Deno.env.get("FORCE_TEST_MODE");

  const cleanup = () => {
    capture.stop();
    capture.clear();

    // Restore original environment
    if (originalLogLevel !== undefined) {
      Deno.env.set("LOG_LEVEL", originalLogLevel);
    } else {
      Deno.env.delete("LOG_LEVEL");
    }
    if (originalLogLength !== undefined) {
      Deno.env.set("LOG_LENGTH", originalLogLength);
    } else {
      Deno.env.delete("LOG_LENGTH");
    }
    if (originalLogKey !== undefined) {
      Deno.env.set("LOG_KEY", originalLogKey);
    } else {
      Deno.env.delete("LOG_KEY");
    }
    if (originalForceTestMode !== undefined) {
      Deno.env.set("FORCE_TEST_MODE", originalForceTestMode);
    } else {
      Deno.env.delete("FORCE_TEST_MODE");
    }
  };

  await t.step(
    "complete workflow with all environment variables",
    async (t) => {
      await t.step("debug level with long messages and key filtering", () => {
        try {
          capture.start();

          // Set up complete environment
          Deno.env.set("LOG_LEVEL", "debug");
          Deno.env.set("LOG_LENGTH", "L"); // 300 characters
          Deno.env.set("LOG_KEY", "auth,database,api");

          // Create loggers for different components
          const authLogger = new BreakdownLogger("auth");
          const dbLogger = new BreakdownLogger("database");
          const apiLogger = new BreakdownLogger("api");
          const cacheLogger = new BreakdownLogger("cache"); // Should be filtered out

          // Log at various levels
          authLogger.debug("User authentication started", { userId: 12345 });
          authLogger.info("Authentication successful");
          authLogger.warn("Password expires soon", { daysLeft: 3 });
          authLogger.error("Authentication failed", {
            reason: "invalid_token",
          });

          dbLogger.debug("Database query executed", {
            query: "SELECT * FROM users WHERE id = ?",
            params: [12345],
            duration: "45ms",
          });
          dbLogger.info("Connection pool status", { active: 5, idle: 3 });

          apiLogger.warn("Rate limit approaching", {
            remaining: 10,
            resetAt: "2023-12-01T11:00:00Z",
          });
          apiLogger.error("External API timeout", {
            endpoint: "/api/v1/users",
            timeout: "30s",
          });

          // This should be filtered out
          cacheLogger.info("Cache hit", { key: "user:12345" });

          // Verify output
          const allOutput = capture.getAllOutput();

          // Should have logs from auth, database, api but not cache
          const authLogs = allOutput.filter((log) => log.includes("[auth]"));
          const dbLogs = allOutput.filter((log) => log.includes("[database]"));
          const apiLogs = allOutput.filter((log) => log.includes("[api]"));
          const cacheLogs = allOutput.filter((log) => log.includes("[cache]"));

          assertEquals(authLogs.length, 4); // debug, info, warn, error
          assertEquals(dbLogs.length, 2); // debug, info
          assertEquals(apiLogs.length, 2); // warn, error
          assertEquals(cacheLogs.length, 0); // filtered out

          // Verify debug logs are included
          assertStringIncludes(
            allOutput.join("\n"),
            "User authentication started",
          );
          assertStringIncludes(allOutput.join("\n"), "Database query executed");

          // Verify data formatting
          assertStringIncludes(allOutput.join("\n"), '"userId": 12345');
          assertStringIncludes(
            allOutput.join("\n"),
            '"query": "SELECT * FROM users WHERE id = ?"',
          );
        } finally {
          cleanup();
        }
      });

      await t.step("error level filtering with short messages", () => {
        try {
          capture.start();

          Deno.env.set("LOG_LEVEL", "error");
          Deno.env.set("LOG_LENGTH", "S"); // 160 characters
          Deno.env.delete("LOG_KEY"); // Allow all keys

          const logger = new BreakdownLogger("error-test");

          // Only error should be logged
          logger.debug("Debug message");
          logger.info("Info message");
          logger.warn("Warning message");
          logger.error("Error message", { critical: true });

          const allOutput = capture.getAllOutput();
          assertEquals(allOutput.length, 1);
          assertStringIncludes(allOutput[0], "[ERROR]");
          assertStringIncludes(allOutput[0], "Error message");
        } finally {
          cleanup();
        }
      });

      await t.step("message truncation with complex data", () => {
        try {
          capture.start();

          Deno.env.set("LOG_LEVEL", "info");
          Deno.env.set("LOG_LENGTH", "DEFAULT"); // 80 characters
          Deno.env.delete("LOG_KEY");

          const logger = new BreakdownLogger("truncation-test");

          const complexData = {
            user: {
              id: 12345,
              name: "John Doe",
              email: "john.doe@example.com",
              profile: {
                age: 30,
                location: "New York",
                preferences: {
                  theme: "dark",
                  language: "en",
                  notifications: true,
                },
              },
            },
            metadata: {
              timestamp: "2023-12-01T10:30:45Z",
              version: "1.0.0",
              environment: "production",
            },
          };

          logger.info(
            "Processing user data with complex nested information",
            complexData,
          );

          const output = capture.logs[0];
          assertEquals(output.length, 80);
          assertStringIncludes(output.slice(-3), "...");
          assertStringIncludes(output, "[INFO]");
          assertStringIncludes(output, "[truncation-test]");
        } finally {
          cleanup();
        }
      });
    },
  );

  await t.step("real-world usage scenarios", async (t) => {
    await t.step("API request/response logging", () => {
      try {
        capture.start();

        Deno.env.set("LOG_LEVEL", "debug");
        Deno.env.set("LOG_LENGTH", "W");
        Deno.env.set("LOG_KEY", "api-client");

        const apiLogger = new BreakdownLogger("api-client");

        // Simulate API request flow
        const requestId = "req-123456";
        const startTime = Date.now();

        apiLogger.debug("Starting API request", {
          requestId,
          method: "POST",
          url: "/api/v1/users",
          headers: { "Content-Type": "application/json" },
        });

        apiLogger.info("Request sent", {
          requestId,
          bodySize: "1.2KB",
        });

        // Simulate processing time
        const endTime = Date.now();

        apiLogger.info("Response received", {
          requestId,
          status: 201,
          duration: `${endTime - startTime}ms`,
          responseSize: "0.8KB",
        });

        apiLogger.debug("Response body", {
          requestId,
          data: {
            id: 12345,
            name: "Created User",
            email: "user@example.com",
          },
        });

        const allOutput = capture.getAllOutput();
        assertEquals(allOutput.length, 4);

        // Verify request tracing
        allOutput.forEach((log) => {
          assertStringIncludes(log, requestId);
        });

        assertStringIncludes(allOutput.join("\n"), "Starting API request");
        assertStringIncludes(allOutput.join("\n"), "Response received");
        assertStringIncludes(allOutput.join("\n"), '"status": 201');
      } finally {
        cleanup();
      }
    });

    await t.step("error handling and recovery", () => {
      try {
        capture.start();

        Deno.env.set("LOG_LEVEL", "warn");
        Deno.env.set("LOG_LENGTH", "L");
        Deno.env.delete("LOG_KEY");

        const errorLogger = new BreakdownLogger("error-handler");

        // Simulate error scenario
        const operation = "user-creation";
        const attemptId = "attempt-789";

        try {
          errorLogger.warn("Retrying failed operation", {
            operation,
            attemptId,
            attempt: 1,
            maxAttempts: 3,
          });

          // Simulate another failure
          throw new Error("Database connection timeout");
        } catch (error) {
          errorLogger.error("Operation failed after retry", {
            operation,
            attemptId,
            error: error instanceof Error ? error.message : String(error),
            finalAttempt: true,
          });

          // Simulate fallback
          errorLogger.warn("Activating fallback mechanism", {
            operation,
            fallback: "cache-lookup",
          });
        }

        const allOutput = capture.getAllOutput();
        assertEquals(allOutput.length, 3); // warn, error, warn

        assertStringIncludes(allOutput.join("\n"), "Retrying failed operation");
        assertStringIncludes(
          allOutput.join("\n"),
          "Database connection timeout",
        );
        assertStringIncludes(
          allOutput.join("\n"),
          "Activating fallback mechanism",
        );
      } finally {
        cleanup();
      }
    });

    await t.step("performance monitoring", () => {
      try {
        capture.start();

        Deno.env.set("LOG_LEVEL", "info");
        Deno.env.set("LOG_LENGTH", "S");
        Deno.env.set("LOG_KEY", "performance");

        const perfLogger = new BreakdownLogger("performance");

        // Simulate performance monitoring
        const operations = [
          "db-query",
          "cache-read",
          "api-call",
          "data-processing",
        ];
        const metrics = operations.map((op) => {
          const startTime = performance.now();

          // Simulate operation
          const randomDelay = Math.random() * 100;
          const endTime = startTime + randomDelay;

          const duration = endTime - startTime;

          perfLogger.info(`Operation completed: ${op}`, {
            operation: op,
            duration: `${duration.toFixed(2)}ms`,
            timestamp: new Date().toISOString(),
          });

          if (duration > 50) {
            perfLogger.warn(`Slow operation detected: ${op}`, {
              operation: op,
              duration: `${duration.toFixed(2)}ms`,
              threshold: "50ms",
            });
          }

          return { operation: op, duration };
        });

        // Summary log
        const totalDuration = metrics.reduce((sum, m) => sum + m.duration, 0);
        perfLogger.info("Performance summary", {
          totalOperations: operations.length,
          totalDuration: `${totalDuration.toFixed(2)}ms`,
          averageDuration: `${
            (totalDuration / operations.length).toFixed(2)
          }ms`,
        });

        const allOutput = capture.getAllOutput();

        // Should have info logs for each operation + summary + any slow operation warnings
        const infoLogs = allOutput.filter((log) => log.includes("[INFO]"));
        const warnLogs = allOutput.filter((log) => log.includes("[WARN]"));

        assertEquals(infoLogs.length, 5); // 4 operations + 1 summary
        assertStringIncludes(allOutput.join("\n"), "Performance summary");

        // Check if any slow operations were detected
        if (warnLogs.length > 0) {
          assertStringIncludes(allOutput.join("\n"), "Slow operation detected");
        }
      } finally {
        cleanup();
      }
    });
  });
});
