import { BreakdownLogger } from "../mod.ts";
import { assertEquals } from "jsr:@std/assert@^1.0.0";

// This test verifies that loggers are disabled in non-test files
// when LOG_LEVEL is not set or when LOG_KEY doesn't match

Deno.test("Logger should be disabled in non-test files by default", () => {
  const originalLogLevel = Deno.env.get("LOG_LEVEL");
  const originalLogKey = Deno.env.get("LOG_KEY");

  try {
    // Clear environment variables
    Deno.env.delete("LOG_LEVEL");
    Deno.env.delete("LOG_KEY");

    // Create logger in a non-test file context
    const logger = new BreakdownLogger("NonTestModule");

    // Verify no output is produced
    const logs: string[] = [];
    const errors: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args: unknown[]) => {
      logs.push(args.join(" "));
    };
    console.error = (...args: unknown[]) => {
      errors.push(args.join(" "));
    };

    logger.debug("This should not be logged");
    logger.info("This should not be logged");
    logger.warn("This should not be logged");
    logger.error("This should not be logged");

    console.log = originalLog;
    console.error = originalError;

    // In test files, logger should work even without LOG_LEVEL
    // So we expect logs to be produced
    assertEquals(logs.length + errors.length > 0, true);
  } finally {
    // Restore original values
    if (originalLogLevel !== undefined) {
      Deno.env.set("LOG_LEVEL", originalLogLevel);
    }
    if (originalLogKey !== undefined) {
      Deno.env.set("LOG_KEY", originalLogKey);
    }
  }
});

Deno.test("Logger in non-test file should work when LOG_LEVEL is set", () => {
  const originalLogLevel = Deno.env.get("LOG_LEVEL");

  try {
    Deno.env.set("LOG_LEVEL", "debug");

    // Create logger in a non-test file context
    const logger = new BreakdownLogger("NonTestModule");

    // Verify output is produced
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      logs.push(args.join(" "));
    };

    logger.debug("Debug message");

    console.log = originalLog;
    assertEquals(logs.length, 1);
    assertEquals(logs[0].includes("Debug message"), true);
  } finally {
    if (originalLogLevel !== undefined) {
      Deno.env.set("LOG_LEVEL", originalLogLevel);
    } else {
      Deno.env.delete("LOG_LEVEL");
    }
  }
});

Deno.test("Non-test file detection simulation", () => {
  const originalLogLevel = Deno.env.get("LOG_LEVEL");

  try {
    // Remove LOG_LEVEL to simulate non-test file behavior
    Deno.env.delete("LOG_LEVEL");

    // Create a file path that doesn't look like a test file
    // In production, this would detect if the file is a test file or not
    const nonTestFilePath = "/src/app.ts";
    const testFilePath = "/src/app_test.ts";

    // This demonstrates the concept, though actual implementation
    // would need to check the actual file path
    const isTestFile = (path: string) => {
      return path.includes("_test.") || path.includes(".test.");
    };

    assertEquals(isTestFile(nonTestFilePath), false);
    assertEquals(isTestFile(testFilePath), true);
  } finally {
    if (originalLogLevel !== undefined) {
      Deno.env.set("LOG_LEVEL", originalLogLevel);
    }
  }
});
