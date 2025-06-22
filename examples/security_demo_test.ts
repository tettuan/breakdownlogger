/**
 * Demonstration file
 * This is not an actual test file, but to demonstrate usage of BreakdownLogger.
 * BreakdownLogger only works in test files, so this file is named _test.ts.
 */

import { BreakdownLogger } from "../mod.ts";

/**
 * Demonstration of BreakdownLogger security features
 *
 * This file shows that BreakdownLogger only works in test files.
 * It does not work in regular application files (.ts).
 */

// Logger works even outside Deno.test() in test files
const outsideLogger = new BreakdownLogger("outside");

// Note: In current implementation, output occurs if in test file
console.log("\n=== Calls outside Deno.test() in test file ===");
outsideLogger.debug("Output since it's in test file - DEBUG");
outsideLogger.info("Output since it's in test file - INFO");
outsideLogger.warn("Output since it's in test file - WARN");
outsideLogger.error("Output since it's in test file - ERROR");
console.log("(The above logs are output)\n");

// Check behavior inside Deno.test()
Deno.test("Security feature demo - inside Deno.test()", () => {
  console.log("=== Calls inside Deno.test() ===");

  const insideLogger = new BreakdownLogger("inside");

  // These will output normally
  insideLogger.info("Works normally inside Deno.test()");
  insideLogger.debug("Debug info can also be output", { testId: 123 });
  insideLogger.warn("Warning message");
  insideLogger.error("Error message", { code: "TEST_ERROR" });

  // Logger created outside also works inside Deno.test()
  outsideLogger.info("Logger created outside also works inside Deno.test()");
});

// Another test case
Deno.test("Actual use case example", () => {
  const logger = new BreakdownLogger("real-use-case");

  // Function to test
  function calculateSum(a: number, b: number): number {
    logger.debug("calculateSum called", { a, b });

    const result = a + b;
    logger.debug("Calculation result", { result });

    return result;
  }

  // Execute test
  logger.info("Test started");
  const sum = calculateSum(5, 3);
  logger.info("Test completed", { expected: 8, actual: sum });
});

// Again, check outside Deno.test() in test file
console.log("\n=== Again, calls outside Deno.test() in test file ===");
const anotherLogger = new BreakdownLogger("another-outside");
anotherLogger.error("This is also output since it's in test file");
console.log("(This log is also output)");

console.log("\n=== Explanation ===");
console.log("BreakdownLogger works with the following mechanism:");
console.log("1. Works only in test files (*_test.ts, *.test.ts)");
console.log("2. No output in regular application files");
console.log("3. This prevents incorrect output in main code");
console.log(
  "4. Prevents leakage of internal processing information in production",
);
console.log("5. Debug information is limited to test execution only");
