import { assert } from "https://deno.land/std@0.219.0/assert/mod.ts";
import { BreakdownLogger } from "../mod.ts";

/**
 * Performance and load testing for BreakdownLogger
 */

Deno.test("BreakdownLogger - Performance Tests", async (t) => {
  await t.step("high volume logging performance", async (t) => {
    await t.step("should handle rapid sequential logging", () => {
      const logger = new BreakdownLogger("perf-test");
      const startTime = performance.now();

      // Log 1000 messages rapidly
      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`, { index: i, timestamp: Date.now() });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (< 1 second)
      assert(duration < 1000, `Logging took too long: ${duration}ms`);
    });

    await t.step("should handle concurrent logger instances", () => {
      const loggers = Array.from(
        { length: 10 },
        (_, i) => new BreakdownLogger(`concurrent-${i}`),
      );

      const startTime = performance.now();

      // Each logger writes 100 messages
      loggers.forEach((logger, index) => {
        for (let i = 0; i < 100; i++) {
          logger.info(`Concurrent message ${i}`, {
            loggerIndex: index,
            messageIndex: i,
          });
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      assert(
        duration < 2000,
        `Concurrent logging took too long: ${duration}ms`,
      );
    });

    await t.step("should handle very large data objects", () => {
      const logger = new BreakdownLogger("large-data");

      // Create a large object
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `This is a description for item ${i}`.repeat(10),
          metadata: {
            created: new Date().toISOString(),
            tags: [`tag-${i}`, `category-${i % 10}`],
            properties: Object.fromEntries(
              Array.from({ length: 20 }, (_, j) => [`prop${j}`, Math.random()]),
            ),
          },
        })),
      };

      const startTime = performance.now();
      logger.info("Large data test", largeObject);
      const endTime = performance.now();

      // Should handle large objects without crashing
      assert(endTime - startTime < 500, "Large object logging took too long");
    });
  });

  await t.step("memory efficiency", async (t) => {
    await t.step("should not accumulate memory over time", () => {
      const logger = new BreakdownLogger("memory-test");

      // Log many messages to test memory behavior
      for (let batch = 0; batch < 10; batch++) {
        for (let i = 0; i < 100; i++) {
          logger.info(`Batch ${batch} Message ${i}`, {
            batch,
            message: i,
            data: Array.from({ length: 100 }, () => Math.random()),
          });
        }
      }

      // Test completes without memory errors
    });

    await t.step(
      "should handle rapid instance creation and destruction",
      () => {
        const startTime = performance.now();

        // Create and use many logger instances
        for (let i = 0; i < 1000; i++) {
          const logger = new BreakdownLogger(`temp-${i}`);
          logger.info(`Temporary logger ${i}`);
          // Logger should be eligible for GC after this scope
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        assert(
          duration < 2000,
          `Rapid instance creation took too long: ${duration}ms`,
        );
      },
    );
  });

  await t.step("stress testing", async (t) => {
    await t.step("should handle extreme load conditions", () => {
      const logger = new BreakdownLogger("stress-test");

      // Simulate extreme load with complex nested objects
      const complexObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  data: Array.from({ length: 100 }, (_, i) => ({
                    id: i,
                    nested: {
                      deep: {
                        structure: {
                          value: Math.random(),
                          array: Array.from(
                            { length: 50 },
                            () => Math.random(),
                          ),
                        },
                      },
                    },
                  })),
                },
              },
            },
          },
        },
      };

      // Log complex objects rapidly
      for (let i = 0; i < 50; i++) {
        logger.error(`Stress test ${i}`, {
          iteration: i,
          timestamp: Date.now(),
          complex: complexObject,
        });
      }

      // Completes without errors
    });
  });
});
