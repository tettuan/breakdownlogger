import {
  assertEquals,
  assertMatch,
} from "https://deno.land/std@0.219.0/assert/mod.ts";
import { BreakdownLogger } from "../mod.ts";
import { EnvironmentConfig } from "../src/environment_config.ts";

// Test utility: Console output capture
class ConsoleCapture {
  private originalLog: typeof console.log;
  private originalError: typeof console.error;
  public logs: string[];
  public errors: string[];

  constructor() {
    this.originalLog = console.log;
    this.originalError = console.error;
    this.logs = [];
    this.errors = [];
    console.log = (message: string) => {
      this.logs.push(message);
    };
    console.error = (message: string) => {
      this.errors.push(message);
    };
  }

  restore() {
    console.log = this.originalLog;
    console.error = this.originalError;
  }

  clear() {
    this.logs = [];
    this.errors = [];
  }
}

// Global capture instance
const capture = new ConsoleCapture();

// Clean up when tests complete
addEventListener("unload", () => {
  capture.restore();
});

Deno.test("BreakdownLogger", async (t) => {
  // Clear logs after each test
  const cleanup = () => {
    capture.clear();
    Deno.env.delete("LOG_LEVEL");
    Deno.env.delete("LOG_LENGTH");
    Deno.env.delete("LOG_KEY");
    // Reset EnvironmentConfig singleton
    EnvironmentConfig.reset();
  };

  await t.step({
    name: "Basic functionality: Default log level (INFO) initialization",
    fn: () => {
      cleanup();
      const logger = new BreakdownLogger("test-key");

      logger.debug("This should not be logged");
      logger.info("This should be logged");

      assertEquals(capture.logs.length, 1);
      // This message is shorter than 80 characters, so no truncation occurs
      assertEquals(capture.logs[0].length, 66);
      assertMatch(
        capture.logs[0],
        /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] \[test-key\] This should be logged$/,
      );
    },
  });

  await t.step({
    name: "Environment variable: LOG_LEVEL=debug setting",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LEVEL", "debug");
      Deno.env.set("LOG_LENGTH", "W"); // Get complete output
      const logger = new BreakdownLogger("test-key");

      logger.debug("Debug message");
      logger.info("Info message");

      assertEquals(capture.logs.length, 2);
      assertMatch(capture.logs[0], /\[DEBUG\]\s\[test-key\]\sDebug message/);
      assertMatch(capture.logs[1], /\[INFO\]\s\[test-key\]\sInfo message/);
    },
  });

  await t.step({
    name: "Data output: Correct formatting of structured data",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LEVEL", "debug");
      Deno.env.set("LOG_LENGTH", "W"); // WHOLE
      const logger = new BreakdownLogger("test-key");
      const testData = { key: "value", nested: { test: true } };

      logger.debug("Message with data", testData);

      assertEquals(capture.logs.length, 1);
      assertMatch(
        capture.logs[0],
        /\[DEBUG\]\s\[test-key\]\sMessage with data\nData:\s{\n\s\s"key":\s"value",\n\s\s"nested":\s{\n\s\s\s\s"test":\strue\n\s\s}\n}/,
      );
    },
  });

  await t.step({
    name: "Log level hierarchy: Lower level filtering at higher levels",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LEVEL", "warn");
      Deno.env.set("LOG_LENGTH", "W"); // Get complete output
      const logger = new BreakdownLogger("test-key");

      logger.debug("Should not log");
      logger.info("Should not log");
      logger.warn("Should log");
      logger.error("Should log");

      assertEquals(capture.logs.length, 1);
      assertEquals(capture.errors.length, 1);
      assertMatch(capture.logs[0], /\[WARN\]\s\[test-key\]\sShould log/);
      assertMatch(capture.errors[0], /\[ERROR\]\s\[test-key\]\sShould log/);
    },
  });

  await t.step({
    name: "Environment variable: LOG_LENGTH=S setting (160 character limit)",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LENGTH", "S");
      const logger = new BreakdownLogger("test-key");
      const longMessage = "a".repeat(150);

      logger.info(longMessage);

      assertEquals(capture.logs.length, 1);
      const output = capture.logs[0];
      // Timestamp + level + key + message within 160 characters
      assertEquals(output.length, 160);
      assertMatch(output, /\.\.\.$/);
    },
  });

  await t.step({
    name: "Environment variable: LOG_KEY filtering (single key)",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_KEY", "allowed-key");
      Deno.env.set("LOG_LENGTH", "W"); // Get complete output
      const logger1 = new BreakdownLogger("allowed-key");
      const logger2 = new BreakdownLogger("not-allowed");

      logger1.info("This should be logged");
      logger2.info("This should NOT be logged");

      assertEquals(capture.logs.length, 1);
      assertMatch(capture.logs[0], /\[allowed-key\]\sThis should be logged/);
    },
  });

  await t.step({
    name: "Environment variable: LOG_KEY filtering (multiple keys)",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_KEY", "key1,key2:key3/key4");
      Deno.env.set("LOG_LENGTH", "W"); // Get complete output
      const logger1 = new BreakdownLogger("key1");
      const logger2 = new BreakdownLogger("key3");
      const logger3 = new BreakdownLogger("key5");

      logger1.info("From key1");
      logger2.info("From key3");
      logger3.info("Should not log");

      assertEquals(capture.logs.length, 2);
      assertMatch(capture.logs[0], /\[key1\]\sFrom key1/);
      assertMatch(capture.logs[1], /\[key3\]\sFrom key3/);
    },
  });

  await t.step({
    name: "Default key: Create BreakdownLogger without arguments",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LENGTH", "W"); // Get complete output
      const logger = new BreakdownLogger();

      logger.info("Message with default key");

      assertEquals(capture.logs.length, 1);
      assertMatch(capture.logs[0], /\[default\]\sMessage with default key/);
    },
  });

  await t.step({
    name: "Error handling: Processing invalid environment variable values",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LEVEL", "INVALID_LEVEL");
      Deno.env.set("LOG_LENGTH", "INVALID");
      const logger = new BreakdownLogger("test-key");

      logger.info("Should log with default settings");
      logger.debug("Should not log");

      assertEquals(capture.logs.length, 1);
      // This message is shorter than 80 characters, so no truncation occurs
      assertEquals(capture.logs[0].length, 77);
      assertMatch(
        capture.logs[0],
        /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] \[test-key\] Should log with default settings$/,
      );
    },
  });

  await t.step({
    name: "Error level: Output to console.error",
    fn: () => {
      cleanup();
      Deno.env.set("LOG_LENGTH", "W"); // Get complete output
      const logger = new BreakdownLogger("error-test");

      logger.error("This is an error", { code: "ERR001" });

      assertEquals(capture.errors.length, 1);
      assertMatch(
        capture.errors[0],
        /\[ERROR\]\s\[error-test\]\sThis is an error/,
      );
    },
  });
});
