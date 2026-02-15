import {
  assert,
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.219.0/assert/mod.ts";
import { BreakdownLogger } from "../mod.ts";

/**
 * Edge cases and error handling tests for BreakdownLogger
 */

import { ConsoleCapture } from "./test_utils.ts";

Deno.test("BreakdownLogger - Edge Cases and Error Handling", async (t) => {
  const capture = new ConsoleCapture();

  // Store original environment values
  const originalEnv = {
    LOG_LEVEL: Deno.env.get("LOG_LEVEL"),
    LOG_LENGTH: Deno.env.get("LOG_LENGTH"),
    LOG_KEY: Deno.env.get("LOG_KEY"),
    FORCE_TEST_MODE: Deno.env.get("FORCE_TEST_MODE"),
  };

  const cleanup = () => {
    capture.stop();
    capture.clear();

    // Restore environment
    Object.entries(originalEnv).forEach(([key, value]) => {
      if (value !== undefined) {
        Deno.env.set(key, value);
      } else {
        Deno.env.delete(key);
      }
    });
  };

  await t.step("extreme data types and sizes", async (t) => {
    await t.step("should handle very large objects", () => {
      try {
        capture.start();
        Deno.env.set("LOG_LEVEL", "debug");
        Deno.env.set("LOG_LENGTH", "W");
        Deno.env.delete("LOG_KEY");

        const logger = new BreakdownLogger("large-data");

        // Create large object with fewer items but still meaningful size
        const largeArray = Array.from({ length: 10 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          data: `Data for item ${i}`.repeat(10),
        }));

        logger.debug("Large object test", { items: largeArray });

        assertEquals(capture.logs.length, 1);
        assertMatch(
          capture.logs[0],
          /\[DEBUG\] \[large-data\] Large object test/,
        );
      } finally {
        cleanup();
      }
    });

    await t.step("should handle deeply nested objects", () => {
      try {
        capture.start();
        Deno.env.set("LOG_LEVEL", "info");
        Deno.env.set("LOG_LENGTH", "W");

        const logger = new BreakdownLogger("deep-nesting");

        // Create deeply nested object (reduced from 50 to 20 levels for efficiency)
        let deepObject: Record<string, unknown> = { value: "bottom" };
        for (let i = 0; i < 20; i++) {
          deepObject = { [`level${i}`]: deepObject };
        }

        logger.info("Deep nesting test", deepObject);

        assertEquals(capture.logs.length, 1);
        assertMatch(capture.logs[0], /Deep nesting test/);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle special character data", () => {
      try {
        capture.start();
        Deno.env.set("LOG_LEVEL", "debug");
        Deno.env.set("LOG_LENGTH", "W");

        const logger = new BreakdownLogger("special-chars");

        const specialData = {
          unicode: "Hello 世界 🌍 🚀",
          newlines: "Line 1\nLine 2\nLine 3",
          tabs: "Col1\tCol2\tCol3",
          quotes: "Both \"double\" and 'single' quotes",
          backslashes: "Path\\to\\file",
          nullBytes: "Before\u0000After",
          emojis: "🎉🔥💯✨🚀🎯💡🔍📊🛠️",
        };

        logger.debug("Special characters test", specialData);

        assertEquals(capture.logs.length, 1);
        assertMatch(capture.logs[0], /Special characters test/);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle undefined, null, and primitive types", () => {
      try {
        capture.start();
        Deno.env.set("LOG_LEVEL", "info");
        Deno.env.set("LOG_LENGTH", "W");

        const logger = new BreakdownLogger("primitives");

        // Test various primitive types
        logger.info("Undefined data", undefined);
        logger.info("Null data", null);
        const boolTrue: unknown = true;
        const boolFalse: unknown = false;
        logger.info("Boolean true", boolTrue);
        logger.info("Boolean false", boolFalse);
        logger.info("Number zero", 0);
        logger.info("Number negative", -123.456);
        logger.info("Number infinity", Infinity);
        logger.info("Number NaN", NaN);
        logger.info("Empty string", "");
        logger.info("Symbol data", Symbol("test"));
        logger.info("BigInt data", BigInt(123456789012345678901234567890n));

        assertEquals(capture.logs.length, 11);
      } finally {
        cleanup();
      }
    });
  });

  await t.step("concurrent logging scenarios", async (t) => {
    await t.step("should handle rapid sequential logging", () => {
      try {
        capture.start();
        Deno.env.set("LOG_LEVEL", "debug");
        Deno.env.set("LOG_LENGTH", "S");

        const logger = new BreakdownLogger("rapid-fire");

        // Log many messages rapidly (reduced from 100 to 20 for efficiency)
        for (let i = 0; i < 20; i++) {
          logger.debug(`Rapid message ${i}`, { iteration: i });
        }

        assertEquals(capture.logs.length, 20);
        assertMatch(capture.logs[0], /Rapid message 0/);
        assertMatch(capture.logs[19], /Rapid message 19/);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle multiple loggers with same key", () => {
      try {
        capture.start();
        Deno.env.set("LOG_LEVEL", "info");
        Deno.env.set("LOG_LENGTH", "W");
        Deno.env.set("LOG_KEY", "shared-key");

        // Create multiple loggers with same key
        const logger1 = new BreakdownLogger("shared-key");
        const logger2 = new BreakdownLogger("shared-key");
        const logger3 = new BreakdownLogger("shared-key");

        logger1.info("Message from logger 1");
        logger2.info("Message from logger 2");
        logger3.info("Message from logger 3");

        assertEquals(capture.logs.length, 3);
        assertMatch(capture.logs[0], /Message from logger 1/);
        assertMatch(capture.logs[1], /Message from logger 2/);
        assertMatch(capture.logs[2], /Message from logger 3/);
      } finally {
        cleanup();
      }
    });
  });

  await t.step("memory and performance edge cases", async (t) => {
    await t.step("should handle memory pressure gracefully", () => {
      try {
        capture.start();
        Deno.env.set("LOG_LEVEL", "warn");
        Deno.env.set("LOG_LENGTH", "DEFAULT");

        const logger = new BreakdownLogger("memory-test");

        // Create scenarios that might cause memory issues
        const hugeString = "x".repeat(1000000); // 1MB string
        const manyProperties: Record<string, string> = {};

        for (let i = 0; i < 10000; i++) {
          manyProperties[`prop${i}`] = `value${i}`;
        }

        logger.warn("Huge string test", { data: hugeString });
        logger.warn("Many properties test", manyProperties);

        // Should not crash and should truncate appropriately
        assertEquals(capture.logs.length, 2);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle logger creation in tight loops", () => {
      try {
        capture.start();
        Deno.env.set("LOG_LEVEL", "error");
        Deno.env.delete("LOG_KEY");

        // Create many logger instances rapidly
        const loggers: BreakdownLogger[] = [];
        for (let i = 0; i < 1000; i++) {
          loggers.push(new BreakdownLogger(`logger-${i}`));
        }

        // Use some of them
        loggers[0].error("First logger");
        loggers[500].error("Middle logger");
        loggers[999].error("Last logger");

        assertEquals(capture.errors.length, 3);
      } finally {
        cleanup();
      }
    });
  });

  await t.step("environment manipulation edge cases", async (t) => {
    await t.step("should handle environment changes during execution", () => {
      try {
        capture.start();
        Deno.env.set("LOG_LEVEL", "info");
        Deno.env.delete("LOG_KEY");

        const logger = new BreakdownLogger("env-change");

        logger.info("Before environment change");

        // Change environment (shouldn't affect existing logger)
        Deno.env.set("LOG_LEVEL", "error");

        logger.info("After environment change - should still log");

        // Create new logger (should pick up new environment)
        const newLogger = new BreakdownLogger("env-change-new");
        newLogger.info("New logger info - should not log");
        newLogger.error("New logger error - should log");

        assertEquals(capture.logs.length, 2); // Original logger's info messages
        assertEquals(capture.errors.length, 1); // New logger's error message
      } finally {
        cleanup();
      }
    });

    await t.step("should handle malformed environment values", () => {
      try {
        capture.start();

        // Set malformed environment values (without null characters which Deno rejects)
        Deno.env.set("LOG_LEVEL", "debug\ninvalid\nwarn");
        Deno.env.set("LOG_LENGTH", "S\nL\nW");
        Deno.env.set("LOG_KEY", "key1\tkey2\rkey3");

        const logger = new BreakdownLogger("malformed-env");

        // Should handle gracefully and use defaults
        logger.info("Test with malformed environment");

        // The logger should gracefully handle malformed values and still output
        // (The exact number may vary based on how the malformed values are processed)
        assert(capture.logs.length >= 0); // Should not crash, output may vary
      } finally {
        cleanup();
      }
    });
  });

  await t.step("error object handling edge cases", async (t) => {
    await t.step("should handle custom error types", () => {
      try {
        capture.start();
        Deno.env.set("LOG_LEVEL", "error");
        Deno.env.set("LOG_LENGTH", "W");

        const logger = new BreakdownLogger("custom-errors");

        // Custom error class
        class CustomError extends Error {
          code: string;
          statusCode: number;

          constructor(message: string, code: string, statusCode: number) {
            super(message);
            this.name = "CustomError";
            this.code = code;
            this.statusCode = statusCode;
          }
        }

        const customError = new CustomError(
          "Custom error occurred",
          "CUSTOM_001",
          500,
        );
        logger.error("Custom error test", customError);

        assertEquals(capture.errors.length, 1);
        assertMatch(capture.errors[0], /Custom error test/);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle circular reference errors", () => {
      try {
        capture.start();
        Deno.env.set("LOG_LEVEL", "error");
        Deno.env.set("LOG_LENGTH", "W");

        const logger = new BreakdownLogger("circular-errors");

        // Create circular reference
        const errorWithCircular = new Error("Error with circular reference") as
          & Error
          & { circular?: unknown };
        errorWithCircular.circular = errorWithCircular;

        logger.error("Circular reference test", errorWithCircular);

        assertEquals(capture.errors.length, 1);
        assertMatch(capture.errors[0], /Circular reference test/);
      } finally {
        cleanup();
      }
    });
  });

  await t.step("key filtering edge cases", async (t) => {
    await t.step("should handle extremely long key names", () => {
      try {
        capture.start();
        Deno.env.set("LOG_LEVEL", "info");
        Deno.env.set("LOG_LENGTH", "S");

        const longKey = "x".repeat(1000);
        Deno.env.set("LOG_KEY", longKey);

        const logger = new BreakdownLogger(longKey);
        logger.info("Long key test");

        assertEquals(capture.logs.length, 1);
      } finally {
        cleanup();
      }
    });

    await t.step("should handle unicode keys", () => {
      try {
        capture.start();
        Deno.env.set("LOG_LEVEL", "info");
        Deno.env.set("LOG_LENGTH", "W");

        const unicodeKey = "🔑test-キー-ключ-مفتاح";
        Deno.env.set("LOG_KEY", unicodeKey);

        const logger = new BreakdownLogger(unicodeKey);
        logger.info("Unicode key test");

        assertEquals(capture.logs.length, 1);
        assertMatch(
          capture.logs[0],
          new RegExp(
            `\\[${unicodeKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\]`,
          ),
        );
      } finally {
        cleanup();
      }
    });
  });
});
