/**
 * Shared test utilities for BreakdownLogger tests.
 *
 * @module
 */

/**
 * Console output capture utility for testing.
 * Captures console.log, console.error, console.warn, and console.debug output.
 */
export class ConsoleCapture {
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

  start(): void {
    console.log = (message: string) => this.logs.push(message);
    console.error = (message: string) => this.errors.push(message);
    console.warn = (message: string) => this.warns.push(message);
    console.debug = (message: string) => this.debugs.push(message);
  }

  stop(): void {
    console.log = this.originalLog;
    console.error = this.originalError;
    console.warn = this.originalWarn;
    console.debug = this.originalDebug;
  }

  clear(): void {
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
 * Environment variable manager for testing.
 * Saves and restores LOG_LEVEL, LOG_LENGTH, LOG_KEY, and FORCE_TEST_MODE.
 */
export class TestEnvironmentManager {
  private savedEnv: Map<string, string | undefined> = new Map();
  private envVars: string[] = [
    "LOG_LEVEL",
    "LOG_LENGTH",
    "LOG_KEY",
    "FORCE_TEST_MODE",
  ];

  save(): void {
    this.envVars.forEach((key) => {
      this.savedEnv.set(key, Deno.env.get(key));
    });
  }

  restore(): void {
    this.savedEnv.forEach((value, key) => {
      if (value === undefined) {
        Deno.env.delete(key);
      } else {
        Deno.env.set(key, value);
      }
    });
    this.savedEnv.clear();
  }

  set(key: string, value: string): void {
    Deno.env.set(key, value);
  }

  delete(key: string): void {
    Deno.env.delete(key);
  }

  clear(): void {
    this.envVars.forEach((key) => Deno.env.delete(key));
  }
}
