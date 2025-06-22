import { BreakdownLogger } from "../mod.ts";

// Example demonstrating various error object output patterns

Deno.test("Error object output patterns", () => {
  // Save original environment values
  const originalLogLevel = Deno.env.get("LOG_LEVEL");
  const originalLogKey = Deno.env.get("LOG_KEY");

  try {
    // Set up environment for demonstration
    Deno.env.set("LOG_LEVEL", "debug");
    Deno.env.set("LOG_KEY", "ErrorExample");

    // Reset the singleton to pick up the environment changes

    const logger = new BreakdownLogger("ErrorExample");

    console.log("=== Error Object Output Patterns Example ===\n");

    // 1. Simple Error
    console.log("1. Simple Error:");
    try {
      throw new Error("Something went wrong");
    } catch (error) {
      logger.error("Simple error occurred", error);
    }

    console.log("\n2. Error with cause:");
    try {
      const cause = new Error("Database connection failed");
      throw new Error("Failed to fetch user data", { cause });
    } catch (error) {
      logger.error("Error with cause", error);
    }

    console.log("\n3. Custom Error with additional properties:");
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

    try {
      throw new CustomError("User not found", "USER_NOT_FOUND", 404);
    } catch (error) {
      logger.error("Custom error with properties", error);
    }

    console.log("\n4. Error with nested object data:");
    const complexError = {
      type: "ValidationError",
      errors: [
        { field: "email", message: "Invalid email format" },
        { field: "password", message: "Password too short" },
      ],
      timestamp: new Date().toISOString(),
      requestId: "req-123456",
    };

    logger.error("Complex validation error", complexError);

    console.log("\n5. TypeError example:");
    try {
      // @ts-ignore - Intentional type error for demonstration
      null.someMethod();
    } catch (error) {
      logger.error("TypeError occurred", error);
    }

    console.log("\n6. Async error with Promise rejection:");
    const failingAsyncOperation = () => {
      return Promise.reject(new Error("Async operation failed"));
    };

    failingAsyncOperation().catch((error) => {
      logger.error("Async error caught", error);
    });

    console.log("\n7. Error with very long stack trace:");
    const deepFunction = (level: number): void => {
      if (level > 0) {
        deepFunction(level - 1);
      } else {
        throw new Error("Deep stack trace error");
      }
    };

    try {
      deepFunction(5);
    } catch (error) {
      logger.error("Error with deep stack", error);
    }

    console.log("\n8. Multiple errors logged together:");
    const errors = [
      new Error("First error"),
      new Error("Second error"),
      new Error("Third error"),
    ];

    logger.error("Multiple errors occurred", { errors, count: errors.length });

    console.log("\n9. Error with circular reference:");
    const circularError = new Error("Circular reference error") as Error & {
      self?: Error;
    };
    circularError.self = circularError;

    logger.error("Error with circular reference", circularError);

    console.log("\n10. Non-Error object logged as error:");
    logger.error(
      "String as error",
      "This is just a string, not an Error object",
    );
    logger.error("Number as error", 42);
    logger.error("Object as error", {
      message: "Not a real error",
      code: "FAKE_ERROR",
    });

    console.log("\n=== End of Error Examples ===");
  } finally {
    // Restore original environment values
    if (originalLogLevel !== undefined) {
      Deno.env.set("LOG_LEVEL", originalLogLevel);
    } else {
      Deno.env.delete("LOG_LEVEL");
    }
    if (originalLogKey !== undefined) {
      Deno.env.set("LOG_KEY", originalLogKey);
    } else {
      Deno.env.delete("LOG_KEY");
    }
    // Reset the singleton after restoring environment
  }
});
