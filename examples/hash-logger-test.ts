import { assertEquals } from "@std/assert";
import {
  createModuleLogger,
  DatabaseConnection,
  LoggerFactory,
  RequestHandler,
  UserService,
} from "./hash-based-logger.ts";

/**
 * Example test file showing hash-based logger usage
 *
 * Run with different LOG_KEY values to see selective output:
 *
 * # See all logs
 * LOG_LEVEL=debug deno test examples/hash-logger-test.ts
 *
 * # See only UserService logs (example hash)
 * LOG_LEVEL=debug LOG_KEY=a3f4b2c1 deno test examples/hash-logger-test.ts
 *
 * # See database query logs with full output
 * LOG_LEVEL=debug LOG_LENGTH=W LOG_KEY=b4c5d6e7 deno test examples/hash-logger-test.ts
 */

Deno.test("UserService with hash-based logger", async () => {
  const userService = new UserService();

  // This will generate logs with hash key like "a3f4b2c1"
  const user = await userService.createUser("test@example.com", "Test User");

  assertEquals(user.email, "test@example.com");
  assertEquals(user.name, "Test User");
  assertEquals(typeof user.userId, "number");
});

Deno.test("DatabaseConnection with method-specific hashes", async () => {
  const db = new DatabaseConnection("postgresql://localhost/testdb");

  // Each method gets its own hash
  await db.connect();

  // Query method has different hash than connect
  const result = await db.query("SELECT * FROM users WHERE id = ?", [123]);

  assertEquals(result.rowCount, 0);
});

Deno.test("LoggerFactory with cached loggers", () => {
  // Same parameters always generate same hash
  const logger1 = LoggerFactory.getLogger("api", "user", "create");
  const logger2 = LoggerFactory.getLogger("api", "user", "create");

  // Different parameters generate different hashes
  const logger3 = LoggerFactory.getLogger("api", "user", "update");

  logger1.debug("Creating user via API");
  logger2.debug("This uses the same logger instance");
  logger3.debug("This uses a different logger instance");

  // Auto logger extracts info from stack trace
  const autoLogger = LoggerFactory.getAutoLogger();
  autoLogger.info("Auto-generated logger based on caller location");
});

Deno.test("RequestHandler with request-scoped hashes", async () => {
  const handler = new RequestHandler();

  // Simulate request handling
  const request = new Request("https://api.example.com/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "New User" }),
  });

  await handler.handleRequest(request);

  // Each request gets unique hash prefix
  const handler2 = new RequestHandler();
  const request2 = new Request("https://api.example.com/users/123", {
    method: "GET",
  });

  await handler2.handleRequest(request2);
});

Deno.test("Module-based logger", () => {
  // Create logger specific to this test module
  const logger = createModuleLogger(import.meta);

  logger.debug("Test module logger initialized");
  logger.info("Running tests with module-specific hash");

  // The hash is generated from the module path
  // Different modules get different hashes automatically
});

Deno.test("Complex debugging scenario", async () => {
  // Simulating a complex application flow
  const logger = LoggerFactory.getLogger("test", "complex", "scenario");

  logger.info("Starting complex operation");

  // User creation
  const userService = new UserService();
  const user = await userService.createUser("complex@test.com", "Complex User");

  // Database operations
  const db = new DatabaseConnection("postgresql://localhost/testdb");
  await db.connect();
  await db.query("INSERT INTO audit_log (user_id, action) VALUES (?, ?)", [
    user.userId,
    "created",
  ]);

  // API request handling
  const handler = new RequestHandler();
  const request = new Request(`https://api.example.com/users/${user.userId}`, {
    method: "GET",
  });
  await handler.handleRequest(request);

  logger.info("Complex operation completed");
});

// Example: Finding specific logs during debugging
console.log(`
=== Hash-based Logger Debugging Guide ===

1. Run all tests with debug logging:
   LOG_LEVEL=debug deno test examples/hash-logger-test.ts

2. Identify the hash keys in the output:
   [DEBUG] [a3f4b2c1] Creating new user...
   [DEBUG] [b4c5d6e7] Executing query...

3. Filter to specific components:
   LOG_KEY=a3f4b2c1 deno test examples/hash-logger-test.ts

4. Multiple components with detailed output:
   LOG_KEY=a3f4b2c1,b4c5d6e7 LOG_LENGTH=L deno test examples/hash-logger-test.ts

5. Full debugging for database operations:
   LOG_KEY=b4c5d6e7 LOG_LENGTH=W deno test examples/hash-logger-test.ts
`);
