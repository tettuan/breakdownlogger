import { assertEquals, assertMatch } from "https://deno.land/std@0.219.0/assert/mod.ts";
import { BreakdownLogger, LogLevel } from "../mod.ts";

Deno.test("BreakdownLogger", async (t) => {
  await t.step("should initialize with default log level (INFO)", () => {
    const logger = new BreakdownLogger();
    // Capture console output
    const originalConsoleLog = console.log;
    const logs: string[] = [];
    console.log = (message: string) => {
      logs.push(message);
    };

    logger.debug("This should not be logged");
    logger.info("This should be logged");
    
    console.log = originalConsoleLog;
    
    assertEquals(logs.length, 1);
    assertMatch(logs[0], /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] This should be logged/);
  });

  await t.step("should respect environment variable LOG_LEVEL", () => {
    Deno.env.set("LOG_LEVEL", "debug");
    const logger = new BreakdownLogger();
    
    const logs: string[] = [];
    const originalConsoleLog = console.log;
    console.log = (message: string) => {
      logs.push(message);
    };

    logger.debug("Debug message");
    logger.info("Info message");
    
    console.log = originalConsoleLog;
    
    assertEquals(logs.length, 2);
    assertMatch(logs[0], /\[DEBUG\] Debug message/);
    assertMatch(logs[1], /\[INFO\] Info message/);
    
    Deno.env.delete("LOG_LEVEL");
  });

  await t.step("should format log entries with data correctly", () => {
    const logger = new BreakdownLogger({ initialLevel: LogLevel.DEBUG });
    const logs: string[] = [];
    const originalConsoleLog = console.log;
    console.log = (message: string) => {
      logs.push(message);
    };

    const testData = { key: "value" };
    logger.debug("Message with data", testData);
    
    console.log = originalConsoleLog;
    
    assertEquals(logs.length, 1);
    assertMatch(logs[0], /\[DEBUG\] Message with data\nデータ: {\n  "key": "value"\n}/);
  });

  await t.step("should handle log level changes", () => {
    const logger = new BreakdownLogger();
    const logs: string[] = [];
    const originalConsoleLog = console.log;
    console.log = (message: string) => {
      logs.push(message);
    };

    logger.debug("Should not log");
    logger.setLogLevel(LogLevel.DEBUG);
    logger.debug("Should log");
    
    console.log = originalConsoleLog;
    
    assertEquals(logs.length, 1);
    assertMatch(logs[0], /\[DEBUG\] Should log/);
  });
}); 