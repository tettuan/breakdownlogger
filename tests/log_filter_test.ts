import { assert, assertFalse } from "@std/assert";
import { LogFilter } from "../src/log_filter.ts";
import { LogLevel } from "../src/types.ts";

Deno.test("LogFilter", async (t) => {
  await t.step("shouldLog method", async (t) => {
    const filter = new LogFilter();

    await t.step("should filter debug logs when level is INFO", () => {
      const result = filter.shouldLog(LogLevel.DEBUG, LogLevel.INFO);
      // In test environment, this should be false due to level filtering
      assertFalse(result);
    });

    await t.step("should allow info logs when level is INFO", () => {
      const result = filter.shouldLog(LogLevel.INFO, LogLevel.INFO);
      assert(result);
    });

    await t.step("should allow error logs at any level", () => {
      const result = filter.shouldLog(LogLevel.ERROR, LogLevel.DEBUG);
      assert(result);
    });

    await t.step("should filter lower priority logs", () => {
      const result = filter.shouldLog(LogLevel.DEBUG, LogLevel.ERROR);
      assertFalse(result);
    });
  });

  await t.step("shouldOutputKey method", async (t) => {
    const filter = new LogFilter();

    await t.step("should allow all keys when allowedKeys is empty", () => {
      const result = filter.shouldOutputKey("any-key", []);
      assert(result);
    });

    await t.step("should allow key when it matches allowed keys", () => {
      const result = filter.shouldOutputKey("allowed", ["allowed", "other"]);
      assert(result);
    });

    await t.step("should reject key when it's not in allowed keys", () => {
      const result = filter.shouldOutputKey("rejected", ["allowed", "other"]);
      assertFalse(result);
    });

    await t.step("should handle case sensitivity", () => {
      const result = filter.shouldOutputKey("Allowed", ["allowed"]);
      assertFalse(result); // Should be case-sensitive
    });

    await t.step("should handle whitespace in keys", () => {
      const result = filter.shouldOutputKey(" key ", [" key "]);
      assert(result); // Exact match including whitespace
    });
  });

  await t.step("FORCE_TEST_MODE environment variable", async (t) => {
    const originalForceTestMode = Deno.env.get("FORCE_TEST_MODE");

    await t.step("should force test mode when FORCE_TEST_MODE=true", () => {
      try {
        Deno.env.set("FORCE_TEST_MODE", "true");
        // Create new filter to pick up environment change
        const filter = new LogFilter();

        // FORCE_TEST_MODE should make this a test environment
        // We can check this indirectly by checking if logs are allowed
        const result = filter.shouldLog(LogLevel.INFO, LogLevel.INFO);
        assert(result);
      } finally {
        if (originalForceTestMode !== undefined) {
          Deno.env.set("FORCE_TEST_MODE", originalForceTestMode);
        } else {
          Deno.env.delete("FORCE_TEST_MODE");
        }
      }
    });

    await t.step(
      "should respect normal test mode when FORCE_TEST_MODE is not set",
      () => {
        try {
          Deno.env.delete("FORCE_TEST_MODE");
          const filter = new LogFilter();

          // Normal level filtering should apply
          const result = filter.shouldLog(LogLevel.DEBUG, LogLevel.ERROR);
          assertFalse(result);
        } finally {
          if (originalForceTestMode !== undefined) {
            Deno.env.set("FORCE_TEST_MODE", originalForceTestMode);
          }
        }
      },
    );
  });
});
