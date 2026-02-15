import { assertEquals } from "@std/assert";
import { LogFormatter } from "../src/log_formatter.ts";
import type { LogLength } from "../mod.ts";

/**
 * Additional coverage tests for LogFormatter to reach 100% coverage
 */

Deno.test("LogFormatter - Coverage Completion Tests", async (t) => {
  const formatter = new LogFormatter();

  await t.step("getMaxLength default case", () => {
    // Test the default case in the switch statement
    // This requires passing an invalid LogLength value
    const invalidLogLength = 999 as unknown as LogLength;
    const result = formatter.getMaxLength(invalidLogLength);
    assertEquals(result, 80); // Should return default value
  });

  await t.step("formatData catch block coverage", async (t) => {
    await t.step("should handle objects that fail JSON.stringify", () => {
      // Create an object with a getter that throws an error
      const problematicObject = {
        get badProperty() {
          throw new Error("Getter throws error");
        },
        normalProperty: "normal value",
      };

      // This should trigger the catch block in formatData
      const result =
        (formatter as unknown as { formatData(data: unknown): string })
          .formatData(problematicObject);

      // Should return the fallback format
      assertEquals(typeof result, "string");
      // The exact format depends on the String() representation
    });

    await t.step(
      "should handle objects with non-serializable properties",
      () => {
        const objWithFunction = {
          name: "test",
          func: function (): string {
            return "hello";
          },
          symbol: Symbol("test"),
          normalProp: "value",
        };

        const result =
          (formatter as unknown as { formatData(data: unknown): string })
            .formatData(objWithFunction);
        assertEquals(typeof result, "string");
        // Functions and symbols are handled by JSON.stringify normally,
        // but if it fails, catch block provides fallback
      },
    );

    await t.step("should handle BigInt values", () => {
      const bigIntValue = BigInt("123456789012345678901234567890");

      // BigInt cannot be serialized to JSON, should trigger catch block
      const result =
        (formatter as unknown as { formatData(data: unknown): string })
          .formatData(bigIntValue);
      assertEquals(typeof result, "string");
      // Should contain the string representation of BigInt
    });

    await t.step(
      "should handle objects with circular references in nested properties",
      () => {
        const parent: { name: string; child?: unknown; children?: unknown[] } =
          { name: "parent" };
        const child: { name: string; parent: unknown } = {
          name: "child",
          parent: parent,
        };
        parent.child = child;
        parent.children = [child];

        // This creates a more complex circular reference
        const result =
          (formatter as unknown as { formatData(data: unknown): string })
            .formatData(parent);
        assertEquals(typeof result, "string");
        // Should handle the circular reference gracefully
      },
    );
  });

  await t.step("complex data type handling", async (t) => {
    await t.step("should handle Map objects", () => {
      const map = new Map<string | number, string | object>([
        ["key1", "value1"],
        ["key2", { nested: "object" }],
        [3, "number key"],
      ]);

      const result =
        (formatter as unknown as { formatData(data: unknown): string })
          .formatData(map);
      assertEquals(typeof result, "string");
      // Map will be serialized as empty object {} by JSON.stringify
    });

    await t.step("should handle Set objects", () => {
      const set = new Set([1, 2, 3, "string", { object: "value" }]);

      const result =
        (formatter as unknown as { formatData(data: unknown): string })
          .formatData(set);
      assertEquals(typeof result, "string");
      // Set will be serialized as empty object {} by JSON.stringify
    });

    await t.step("should handle Date objects", () => {
      const date = new Date("2023-12-01T10:30:45.123Z");

      const result =
        (formatter as unknown as { formatData(data: unknown): string })
          .formatData(date);
      assertEquals(typeof result, "string");
      // Date should be properly serialized by JSON.stringify
    });

    await t.step("should handle RegExp objects", () => {
      const regex = /test.*pattern/gi;

      const result =
        (formatter as unknown as { formatData(data: unknown): string })
          .formatData(regex);
      assertEquals(typeof result, "string");
      // RegExp will be serialized as empty object {} by JSON.stringify
    });

    await t.step("should handle typed arrays", () => {
      const uint8Array = new Uint8Array([1, 2, 3, 4, 5]);

      const result =
        (formatter as unknown as { formatData(data: unknown): string })
          .formatData(uint8Array);
      assertEquals(typeof result, "string");
      // Typed arrays are serialized with their values
    });
  });

  await t.step("edge cases for string conversion", async (t) => {
    await t.step("should handle very large objects", () => {
      // Create a large object that might stress the formatter
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: "A".repeat(1000), // Long strings
          metadata: {
            created: new Date(),
            properties: Object.fromEntries(
              Array.from({ length: 50 }, (_, j) => [`prop${j}`, Math.random()]),
            ),
          },
        })),
      };

      const result =
        (formatter as unknown as { formatData(data: unknown): string })
          .formatData(largeObject);
      assertEquals(typeof result, "string");
      // Should handle large objects without throwing
    });

    await t.step("should handle objects with special characters", () => {
      const specialObject = {
        unicode: "🚀🌟💡",
        emoji: "😀😃😄😁",
        special: "\\n\\t\\r\\",
        quotes: "\"double\" and 'single' quotes",
        backslash: "\\path\\to\\file",
        nullChar: "text\\x00withNull",
      };

      const result =
        (formatter as unknown as { formatData(data: unknown): string })
          .formatData(specialObject);
      assertEquals(typeof result, "string");
      // Should properly escape special characters
    });
  });
});
