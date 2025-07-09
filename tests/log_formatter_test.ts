import {
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.219.0/assert/mod.ts";
import { LogFormatter } from "../src/log_formatter.ts";
import type { LogEntry } from "../src/types.ts";
import { LogLength, LogLevel } from "../src/types.ts";

Deno.test("LogFormatter", async (t) => {
  const formatter = new LogFormatter();

  await t.step("formatLogEntry method", async (t) => {
    await t.step("should format basic log entry without data", () => {
      const entry: LogEntry = {
        timestamp: new Date("2023-12-01T10:30:45.123Z"),
        level: LogLevel.INFO,
        key: "test-key",
        message: "Test message",
      };

      const result = formatter.formatLogEntry(entry, -1);
      assertEquals(result, "[INFO] [test-key] Test message");
    });

    await t.step("should format log entry with data", () => {
      const entry: LogEntry = {
        timestamp: new Date("2023-12-01T10:30:45.123Z"),
        level: LogLevel.ERROR,
        key: "error-key",
        message: "Error occurred",
        data: { code: "ERR001", details: "Something went wrong" },
      };

      const result = formatter.formatLogEntry(entry, -1);
      assertMatch(
        result,
        /^\[ERROR\] \[error-key\] Error occurred\nData: {\n\s+"code": "ERR001",\n\s+"details": "Something went wrong"\n}\nTimestamp: 2023-12-01T10:30:45\.123Z$/,
      );
    });

    await t.step("should truncate long messages", () => {
      const entry: LogEntry = {
        timestamp: new Date("2023-12-01T10:30:45.123Z"),
        level: LogLevel.DEBUG,
        key: "debug-key",
        message: "A".repeat(100),
      };

      const result = formatter.formatLogEntry(entry, 50);
      assertEquals(result.length, 50);
      assertEquals(result.slice(-3), "...");
    });

    await t.step("should handle circular reference in data", () => {
      const circularObj: Record<string, unknown> = { name: "test" };
      circularObj.self = circularObj;

      const entry: LogEntry = {
        timestamp: new Date("2023-12-01T10:30:45.123Z"),
        level: LogLevel.WARN,
        key: "circular-key",
        message: "Circular data",
        data: circularObj,
      };

      const result = formatter.formatLogEntry(entry, -1);
      assertMatch(
        result,
        /\[WARN\] \[circular-key\] Circular data\nData: \[Object: /,
      );
    });
  });

  await t.step("getMaxLength method", async (t) => {
    await t.step("should return correct length for DEFAULT", () => {
      const result = formatter.getMaxLength(LogLength.DEFAULT);
      assertEquals(result, 80);
    });

    await t.step("should return correct length for SHORT", () => {
      const result = formatter.getMaxLength(LogLength.SHORT);
      assertEquals(result, 160);
    });

    await t.step("should return correct length for LONG", () => {
      const result = formatter.getMaxLength(LogLength.LONG);
      assertEquals(result, 300);
    });

    await t.step("should return -1 for WHOLE (unlimited)", () => {
      const result = formatter.getMaxLength(LogLength.WHOLE);
      assertEquals(result, -1);
    });
  });

  await t.step("formatData method edge cases", async (t) => {
    await t.step("should handle undefined data", () => {
      const entry: LogEntry = {
        timestamp: new Date("2023-12-01T10:30:45.123Z"),
        level: LogLevel.INFO,
        key: "test-key",
        message: "Test message",
        data: undefined,
      };

      const result = formatter.formatLogEntry(entry, -1);
      assertEquals(result, "[INFO] [test-key] Test message");
    });

    await t.step("should handle null data", () => {
      const entry: LogEntry = {
        timestamp: new Date("2023-12-01T10:30:45.123Z"),
        level: LogLevel.INFO,
        key: "test-key",
        message: "Test message",
        data: null,
      };

      const result = formatter.formatLogEntry(entry, -1);
      assertMatch(result, /\nData: null\n/);
    });

    await t.step("should handle string data", () => {
      const entry: LogEntry = {
        timestamp: new Date("2023-12-01T10:30:45.123Z"),
        level: LogLevel.INFO,
        key: "test-key",
        message: "Test message",
        data: "simple string",
      };

      const result = formatter.formatLogEntry(entry, -1);
      assertMatch(result, /\nData: simple string\n/);
    });

    await t.step("should handle number data", () => {
      const entry: LogEntry = {
        timestamp: new Date("2023-12-01T10:30:45.123Z"),
        level: LogLevel.INFO,
        key: "test-key",
        message: "Test message",
        data: 42,
      };

      const result = formatter.formatLogEntry(entry, -1);
      assertMatch(result, /\nData: 42\n/);
    });

    await t.step("should handle boolean data", () => {
      const entry: LogEntry = {
        timestamp: new Date("2023-12-01T10:30:45.123Z"),
        level: LogLevel.INFO,
        key: "test-key",
        message: "Test message",
        data: true,
      };

      const result = formatter.formatLogEntry(entry, -1);
      assertMatch(result, /\nData: true\n/);
    });

    await t.step("should handle Error objects", () => {
      const error = new Error("Test error");
      const entry: LogEntry = {
        timestamp: new Date("2023-12-01T10:30:45.123Z"),
        level: LogLevel.ERROR,
        key: "error-key",
        message: "Error occurred",
        data: error,
      };

      const result = formatter.formatLogEntry(entry, -1);
      assertMatch(result, /\nData: {}\n/);
    });

    await t.step("should handle complex nested objects", () => {
      const complexData = {
        level1: {
          level2: {
            level3: {
              deep: "value",
              array: [1, 2, 3],
              nested: { more: "data" },
            },
          },
        },
        metadata: {
          timestamp: "2023-12-01",
          version: "1.0.0",
        },
      };

      const entry: LogEntry = {
        timestamp: new Date("2023-12-01T10:30:45.123Z"),
        level: LogLevel.DEBUG,
        key: "complex-key",
        message: "Complex data test",
        data: complexData,
      };

      const result = formatter.formatLogEntry(entry, -1);
      assertMatch(
        result,
        /\[DEBUG\] \[complex-key\] Complex data test\nData: {\n/,
      );
      assertMatch(result, /"deep": "value"/);
      assertMatch(result, /"array": \[\n\s+1,\n\s+2,\n\s+3\n\s+\]/);
    });
  });

  await t.step("truncation behavior", async (t) => {
    await t.step("should not truncate when maxLength is -1", () => {
      const longMessage = "A".repeat(1000);
      const entry: LogEntry = {
        timestamp: new Date("2023-12-01T10:30:45.123Z"),
        level: LogLevel.INFO,
        key: "long-key",
        message: longMessage,
      };

      const result = formatter.formatLogEntry(entry, -1);
      assertEquals(result.length, 18 + longMessage.length); // "[INFO] [long-key] " + message
    });

    await t.step("should preserve important parts when truncating", () => {
      const entry: LogEntry = {
        timestamp: new Date("2023-12-01T10:30:45.123Z"),
        level: LogLevel.INFO,
        key: "key",
        message: "Short message",
        data: { large: "A".repeat(200) },
      };

      const result = formatter.formatLogEntry(entry, 100);
      assertEquals(result.length, 100);
      assertEquals(result.slice(-3), "...");
      // Should still contain level and key
      assertMatch(result, /^\[INFO\] \[key\]/);
    });
  });
});
