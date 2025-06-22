import { BreakdownLogger } from "../mod.ts";

/**
 * Simple hash function for demonstration purposes
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 8);
}

/**
 * Generate a hash-based key from file path and function name
 */
function generateLogKey(filePath: string, functionName: string): string {
  const combined = `${filePath}:${functionName}`;
  return simpleHash(combined);
}

/**
 * Generate a hash-based key from multiple parameters
 */
function generateComplexLogKey(...parts: string[]): string {
  const combined = parts.join(":");
  return simpleHash(combined);
}

// Example 1: Simple hash-based logger for a specific function
export class UserService {
  private logger: BreakdownLogger;

  constructor() {
    // Generate hash from file and class name
    const logKey = generateLogKey("services/UserService.ts", "UserService");
    this.logger = new BreakdownLogger(logKey); // e.g., "a3f4b2c1"
  }

  createUser(email: string, name: string) {
    this.logger.debug("Creating new user", { email, name });

    // Simulate user creation
    const userId = Math.floor(Math.random() * 10000);

    this.logger.info("User created successfully", { userId, email });
    return { userId, email, name };
  }
}

// Example 2: Dynamic hash generation per method
export class DatabaseConnection {
  private baseKey: string;

  constructor(private connectionString: string) {
    // Generate base key from connection string
    this.baseKey = generateLogKey("db/DatabaseConnection.ts", connectionString);
  }

  private getMethodLogger(methodName: string): BreakdownLogger {
    // Generate unique hash for each method
    const methodKey = generateComplexLogKey(this.baseKey, methodName);
    return new BreakdownLogger(methodKey);
  }

  query(sql: string, params: unknown[]) {
    const logger = this.getMethodLogger("query");

    logger.debug("Executing query", { sql, params });

    try {
      // Simulate query execution
      const result = { rows: [], rowCount: 0 };
      logger.debug("Query executed successfully", {
        rowCount: result.rowCount,
      });
      return result;
    } catch (error) {
      logger.error("Query failed", {
        sql,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async connect() {
    const logger = this.getMethodLogger("connect");

    logger.info("Attempting to connect to database");

    try {
      // Simulate connection
      await new Promise((resolve) => setTimeout(resolve, 100));
      logger.info("Database connection established");
    } catch (error) {
      logger.error("Failed to connect", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Example 3: Hash-based logger factory
export class LoggerFactory {
  private static loggerCache = new Map<string, BreakdownLogger>();

  /**
   * Get or create a logger with hash-based key
   */
  static getLogger(
    namespace: string,
    component: string,
    operation?: string,
  ): BreakdownLogger {
    const parts = [namespace, component];
    if (operation) parts.push(operation);

    const logKey = generateComplexLogKey(...parts);

    // Cache loggers to avoid recreating
    if (!this.loggerCache.has(logKey)) {
      this.loggerCache.set(logKey, new BreakdownLogger(logKey));
    }

    return this.loggerCache.get(logKey)!;
  }

  /**
   * Get logger with auto-generated key from stack trace
   */
  static getAutoLogger(): BreakdownLogger {
    const stack = new Error().stack!;
    const lines = stack.split("\n");
    // Extract caller information from stack trace
    const callerLine = lines[2]; // Skip Error and getAutoLogger lines

    // Extract file path and function from stack trace
    const match = callerLine.match(/at (.+?) \((.+?):(\d+):(\d+)\)/);
    if (match) {
      const functionName = match[1];
      const filePath = match[2];
      const logKey = generateLogKey(filePath, functionName);
      return new BreakdownLogger(logKey);
    }

    // Fallback to default
    return new BreakdownLogger("auto");
  }
}

// Example 4: Request-scoped hash logger
export class RequestHandler {
  private requestId: string;
  private loggers: Map<string, BreakdownLogger> = new Map();

  constructor() {
    // Generate unique request ID
    this.requestId = generateComplexLogKey(
      "request",
      Date.now().toString(),
      Math.random().toString(36),
    );
  }

  private getLogger(operation: string): BreakdownLogger {
    const key = `${this.requestId}-${operation}`;
    if (!this.loggers.has(key)) {
      const hashKey = generateComplexLogKey(this.requestId, operation);
      this.loggers.set(key, new BreakdownLogger(hashKey));
    }
    return this.loggers.get(key)!;
  }

  handleRequest(request: Request) {
    const logger = this.getLogger("handleRequest");

    logger.info("Processing request", {
      method: request.method,
      url: request.url,
    });

    // Authentication
    const authLogger = this.getLogger("auth");
    authLogger.debug("Checking authentication");

    // Business logic
    const businessLogger = this.getLogger("business");
    businessLogger.debug("Executing business logic");

    // Response
    const responseLogger = this.getLogger("response");
    responseLogger.info("Sending response", { status: 200 });
  }
}

// Example 5: Module-based hash generation
export function createModuleLogger(importMeta: ImportMeta): BreakdownLogger {
  // Extract module path from import.meta.url
  const url = new URL(importMeta.url);
  const modulePath = url.pathname;

  // Generate hash from module path
  const moduleKey = generateLogKey(modulePath, "module");

  return new BreakdownLogger(moduleKey);
}

// Usage in a module:
// const logger = createModuleLogger(import.meta);

// Example test showing how to use hash-based loggers
if (import.meta.main) {
  console.log("Hash-based logger examples:");

  // Show generated hashes
  console.log(
    "UserService hash:",
    generateLogKey("services/UserService.ts", "UserService"),
  );
  console.log(
    "DatabaseConnection.query hash:",
    generateComplexLogKey("db/DatabaseConnection.ts", "query"),
  );
  console.log(
    "Request handler hash:",
    generateComplexLogKey("request", Date.now().toString(), "abc123"),
  );

  // Example usage with environment variables:
  console.log("\nTo debug specific components:");
  console.log("LOG_KEY=a3f4b2c1 deno test  # Debug UserService only");
  console.log(
    "LOG_KEY=a3f4b2c1,b4c5d6e7 deno test  # Debug multiple components",
  );
  console.log(
    "LOG_LEVEL=debug LOG_LENGTH=W LOG_KEY=a3f4b2c1 deno test  # Full debug output for UserService",
  );
}
