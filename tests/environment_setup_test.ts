import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.219.0/assert/mod.ts";
import {
  afterEach,
  beforeEach,
  describe,
  it,
} from "https://deno.land/std@0.219.0/testing/bdd.ts";
import { BreakdownLogger } from "../mod.ts";
import { EnvironmentConfig } from "../src/environment_config.ts";
import { LogLength, LogLevel } from "../src/types.ts";

/**
 * Test utilities for capturing console output
 */
class TestConsoleCapture {
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

/**
 * Environment variable manager for testing
 */
class TestEnvironmentManager {
  private savedEnv: Map<string, string | undefined> = new Map();
  private envVars: string[] = ["LOG_LEVEL", "LOG_LENGTH", "LOG_KEY"];

  save() {
    this.envVars.forEach((key) => {
      this.savedEnv.set(key, Deno.env.get(key));
    });
  }

  restore() {
    this.savedEnv.forEach((value, key) => {
      if (value === undefined) {
        Deno.env.delete(key);
      } else {
        Deno.env.set(key, value);
      }
    });
    this.savedEnv.clear();
  }

  set(key: string, value: string) {
    Deno.env.set(key, value);
  }

  delete(key: string) {
    Deno.env.delete(key);
  }

  clear() {
    this.envVars.forEach((key) => Deno.env.delete(key));
  }
}

/**
 * Mock logger for testing logger initialization
 */
class MockLogger extends BreakdownLogger {
  public initCalled = false;
  public configAccessed = false;

  constructor(key?: string) {
    super(key);
    this.initCalled = true;
  }

  getConfig(): EnvironmentConfig {
    this.configAccessed = true;
    return new EnvironmentConfig();
  }
}

describe("Environment Setup Tests", () => {
  const consoleCapture = new TestConsoleCapture();
  const envManager = new TestEnvironmentManager();

  beforeEach(() => {
    envManager.save();
    envManager.clear();
    consoleCapture.clear();
    consoleCapture.start();
  });

  afterEach(() => {
    consoleCapture.stop();
    envManager.restore();
  });

  describe("Environment Variable Setting", () => {
    it("should correctly set and read LOG_LEVEL environment variable", () => {
      envManager.set("LOG_LEVEL", "debug");
      const config = new EnvironmentConfig();
      assertEquals(config.getLogLevel(), LogLevel.DEBUG);
    });

    it("should handle case-insensitive LOG_LEVEL values", () => {
      const testCases = [
        { input: "DEBUG", expected: LogLevel.DEBUG },
        { input: "Info", expected: LogLevel.INFO },
        { input: "WARN", expected: LogLevel.WARN },
        { input: "error", expected: LogLevel.ERROR },
      ];

      testCases.forEach(({ input, expected }) => {
        envManager.set("LOG_LEVEL", input);
        const config = new EnvironmentConfig();
        assertEquals(config.getLogLevel(), expected);
      });
    });

    it("should use default LOG_LEVEL when not set", () => {
      const config = new EnvironmentConfig();
      assertEquals(config.getLogLevel(), LogLevel.INFO);
    });

    it("should handle invalid LOG_LEVEL values gracefully", () => {
      envManager.set("LOG_LEVEL", "INVALID_LEVEL");
      const config = new EnvironmentConfig();
      assertEquals(config.getLogLevel(), LogLevel.INFO);
    });

    it("should correctly parse LOG_LENGTH values", () => {
      const testCases = [
        { input: "S", expected: LogLength.SHORT },
        { input: "L", expected: LogLength.LONG },
        { input: "W", expected: LogLength.WHOLE },
        { input: "s", expected: LogLength.SHORT },
        { input: "l", expected: LogLength.LONG },
        { input: "w", expected: LogLength.WHOLE },
      ];

      testCases.forEach(({ input, expected }) => {
        envManager.set("LOG_LENGTH", input);
        const config = new EnvironmentConfig();
        assertEquals(config.getLogLength(), expected);
      });
    });

    it("should parse LOG_KEY with multiple separators", () => {
      const testCases = [
        { input: "key1,key2,key3", expected: ["key1", "key2", "key3"] },
        { input: "key1:key2:key3", expected: ["key1", "key2", "key3"] },
        { input: "key1/key2/key3", expected: ["key1", "key2", "key3"] },
        {
          input: "key1,key2:key3/key4",
          expected: ["key1", "key2", "key3", "key4"],
        },
        { input: "  key1  ,  key2  ", expected: ["  key1  ", "  key2  "] },
      ];

      testCases.forEach(({ input, expected }) => {
        envManager.set("LOG_KEY", input);
        const config = new EnvironmentConfig();
        assertEquals(config.getLogKeys(), expected);
      });
    });
  });

  describe("Test Environment Initialization", () => {
    it("should initialize test environment with clean state", () => {
      // Verify environment is clean
      assertEquals(Deno.env.get("LOG_LEVEL"), undefined);
      assertEquals(Deno.env.get("LOG_LENGTH"), undefined);
      assertEquals(Deno.env.get("LOG_KEY"), undefined);

      // Verify default configuration
      const config = new EnvironmentConfig();
      assertEquals(config.getLogLevel(), LogLevel.INFO);
      assertEquals(config.getLogLength(), LogLength.DEFAULT);
      assertEquals(config.getLogKeys(), []);
    });

    it("should reflect environment changes immediately", () => {
      envManager.set("LOG_LEVEL", "debug");
      const config1 = new EnvironmentConfig();
      assertEquals(config1.getLogLevel(), LogLevel.DEBUG);

      envManager.set("LOG_LEVEL", "error");
      const config2 = new EnvironmentConfig();
      assertEquals(config2.getLogLevel(), LogLevel.ERROR);
    });

    it("should maintain environment isolation between tests", () => {
      // This test verifies that environment changes don't leak between tests
      envManager.set("LOG_LEVEL", "warn");
      const logger = new BreakdownLogger("test");

      logger.debug("Should not log");
      logger.warn("Should log");

      assertEquals(consoleCapture.debugs.length, 0);
      assertEquals(consoleCapture.logs.length, 1);
    });

    it("should support dynamic environment changes during test", () => {
      const logger = new BreakdownLogger("dynamic-test");

      // Initial state - INFO level
      logger.debug("Debug 1 - should not log");
      logger.info("Info 1 - should log");
      assertEquals(consoleCapture.logs.length, 1);

      // Change environment variables
      envManager.set("LOG_LEVEL", "debug");
      envManager.set("LOG_LENGTH", "W");

      // Create new logger which will read the updated environment
      const logger2 = new BreakdownLogger("dynamic-test");
      logger2.debug("Debug 2 - should log");
      logger2.info("Info 2 - should log");

      const allOutput = consoleCapture.getAllOutput();
      assertEquals(allOutput.length, 3); // 1 from first logger, 2 from second
    });
  });

  describe("Mock and Stub Setup Examples", () => {
    it("should demonstrate mocking logger initialization", () => {
      const mockLogger = new MockLogger("mock-test");

      assertExists(mockLogger);
      assertEquals(mockLogger.initCalled, true);

      // Access config through mock
      const config = mockLogger.getConfig();
      assertEquals(mockLogger.configAccessed, true);
      assertExists(config);
    });

    it("should demonstrate stubbing console methods", () => {
      const stubCalls: Array<{ method: string; args: unknown[] }> = [];

      // Create stubs for all console methods
      const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        debug: console.debug,
      };

      console.log = (...args: unknown[]) =>
        stubCalls.push({ method: "log", args });
      console.error = (...args: unknown[]) =>
        stubCalls.push({ method: "error", args });
      console.warn = (...args: unknown[]) =>
        stubCalls.push({ method: "warn", args });
      console.debug = (...args: unknown[]) =>
        stubCalls.push({ method: "debug", args });

      // Test logger with stubs
      envManager.set("LOG_LEVEL", "debug");
      envManager.set("LOG_LENGTH", "W");

      const logger = new BreakdownLogger("stub-test");
      logger.debug("Debug message");
      logger.info("Info message");
      logger.warn("Warn message");
      logger.error("Error message");

      // Verify stub calls
      assertEquals(stubCalls.length, 4);
      assertEquals(stubCalls[0].method, "log");
      assertEquals(stubCalls[1].method, "log");
      assertEquals(stubCalls[2].method, "log");
      assertEquals(stubCalls[3].method, "error");

      // Restore console
      Object.assign(console, originalConsole);
    });

    it("should demonstrate environment variable mocking", () => {
      // Mock Deno.env.get to return specific values
      const originalGet = Deno.env.get;
      const mockEnv = new Map<string, string>([
        ["LOG_LEVEL", "debug"],
        ["LOG_LENGTH", "L"],
        ["LOG_KEY", "test-key,mock-key"],
      ]);

      Deno.env.get = (key: string) => mockEnv.get(key);

      const config = new EnvironmentConfig();

      assertEquals(config.getLogLevel(), LogLevel.DEBUG);
      assertEquals(config.getLogLength(), LogLength.LONG);
      assertEquals(config.getLogKeys(), ["test-key", "mock-key"]);

      // Restore original
      Deno.env.get = originalGet;
    });

    it("should demonstrate setup for integration testing", () => {
      // Complete test setup example
      class TestSetup {
        private envManager: TestEnvironmentManager;
        private consoleCapture: TestConsoleCapture;
        private originalConfig: EnvironmentConfig | null = null;

        constructor() {
          this.envManager = new TestEnvironmentManager();
          this.consoleCapture = new TestConsoleCapture();
        }

        setup(options: {
          logLevel?: string;
          logLength?: string;
          logKeys?: string;
        }) {
          // Save current state
          this.envManager.save();
          this.envManager.clear();

          // Apply test configuration
          if (options.logLevel) {
            this.envManager.set("LOG_LEVEL", options.logLevel);
          }
          if (options.logLength) {
            this.envManager.set("LOG_LENGTH", options.logLength);
          }
          if (options.logKeys) this.envManager.set("LOG_KEY", options.logKeys);

          // Start capturing
          this.consoleCapture.start();
        }

        teardown() {
          this.consoleCapture.stop();
          this.envManager.restore();
        }

        getOutput() {
          return this.consoleCapture.getAllOutput();
        }
      }

      // Use the test setup
      const setup = new TestSetup();
      setup.setup({
        logLevel: "debug",
        logLength: "W",
        logKeys: "integration-test",
      });

      const logger = new BreakdownLogger("integration-test");
      logger.debug("Test message", { data: "test" });

      const output = setup.getOutput();
      assertEquals(output.length, 1);
      assertExists(output[0].match(/\[DEBUG\]/));
      assertExists(output[0].match(/integration-test/));

      setup.teardown();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty environment variables", () => {
      envManager.set("LOG_LEVEL", "");
      envManager.set("LOG_LENGTH", "");
      envManager.set("LOG_KEY", "");

      const config = new EnvironmentConfig();

      assertEquals(config.getLogLevel(), LogLevel.INFO);
      assertEquals(config.getLogLength(), LogLength.DEFAULT);
      assertEquals(config.getLogKeys(), []);
    });

    it("should handle whitespace in LOG_KEY", () => {
      envManager.set("LOG_KEY", "  key1  ,  ,  key2  ,  ");
      const config = new EnvironmentConfig();

      assertEquals(config.getLogKeys(), ["  key1  ", "  key2  "]);
    });

    it("should create independent instances", () => {
      const configs: EnvironmentConfig[] = [];

      // Create multiple instances
      for (let i = 0; i < 10; i++) {
        configs.push(new EnvironmentConfig());
      }

      // All should be independent instances with same configuration
      const firstConfig = configs[0];
      configs.forEach((config) => {
        // Different instances but same configuration values
        assertEquals(config.getLogLevel(), firstConfig.getLogLevel());
        assertEquals(config.getLogLength(), firstConfig.getLogLength());
        assertEquals(
          config.getLogKeys().length,
          firstConfig.getLogKeys().length,
        );
      });
    });
  });
});

// Additional test utilities that can be imported by other test files
export { TestConsoleCapture, TestEnvironmentManager };
