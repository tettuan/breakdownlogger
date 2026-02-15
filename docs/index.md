# Library Overview

> **Related Documents**: [日本語版](index.ja.md) |
> [Development Guide (ja)](development.ja.md) | [Glossary (ja)](glossary.ja.md)

A debugging logger library built with Deno and published to JSR. It is designed
to be used within applications and does not run standalone.

# Specifications

BreakdownLogger is a logging system designed to assist with debugging
application configuration and path resolution. It outputs only to standard
output (or standard error) when executed from test code, without writing to log
files.

## Use Cases

Called from test code (*_test.ts). While timing is flexible, the following are
considered important debugging points:

- Before function calls
- Immediately after receiving arguments
- Just before return values
- Immediately after receiving return values
- Before and after important processing operations

When calling, since LOG_LEVEL alone may provide too much information, the
following features help control output:

- Information volume control
  - Default: Truncates each log message to 80 characters
  - With length specification:
    - Short: 160 characters
    - Long: 300 characters
    - Whole: All content
- Output location KEY for specifying error locations
  - Assign unique KEYs to log output locations
    - e.g., `new BreakdownLogger('hash1234')`
  - Including the output location KEY helps identify problem areas

This allows for writing extensive logging while keeping total output manageable
and enabling detailed analysis when needed.

Examples:

- `LOG_LEVEL=debug deno test`
- `LOG_LEVEL=debug LOG_LENGTH=S deno test tests/package/*` # S: Short
- `LOG_LEVEL=debug LOG_LENGTH=L deno test tests/package/a_file_test.ts` # L:
  Long
- `LOG_LEVEL=debug LOG_LENGTH=W LOG_KEY=hash1234 deno test tests/package/a_file_test.ts`
  # W: Whole

## Clear Requirements

### Definitions

#### Log Levels

1. DEBUG: Detailed debugging information
2. INFO: General information
3. WARN: Warnings
4. ERROR: Errors

#### Log Output Length

- Default: 80 characters
- Short: 160 characters
- Long: 300 characters
- Whole: All content

#### Output Items

1. Log output items
   - Log level
   - Output location KEY
   - Message content
   - Object dump (when necessary)
   - Timestamp (appended at the end only when data is present)

### Runtime

Log enable/disable toggle

- Specify during test execution like `LOG_LEVEL=debug deno test`
- `LOG_LENGTH`, `LOG_KEY` can also be specified

### Runtime Output Filter Processing

1. Log level control
   - Only output logs at or above the set level
     - DEBUG is the most detailed
     - INFO, WARN, ERROR are also output when DEBUG is specified
     - INFO is output without LOG_LEVEL specification
       - WARN, ERROR are also output
     - WARN is output for warnings (used in warning branches)
     - ERROR is output for errors (used in error handling)

2. Log output length control

LOG_LENGTH=S LOG_LENGTH=L LOG_LENGTH=W LOG_LENGTH= # null, default

Length includes both message and data. Emphasize to users the importance of
"placing important information at the beginning of messages" so that status is
clear even when truncated.

3. Output location KEY control

- Only output the specified KEY
- Multiple keys can be specified with delimiters
  - LOG_KEY=hash1234,hash2345
  - LOG_KEY=hash1234/hash2345
  - LOG_KEY=hash1234:hash2345
  - Delimiters: any of ",/:"

#### Detailed LOG_LENGTH Use Cases

##### Basic Usage

LOG_LENGTH controls how much of each log message is displayed. This is essential
for balancing between having enough information for debugging and keeping the
overall output readable when there are many log entries.

```typescript
// Example messages with varying lengths
const logger = new BreakdownLogger("data-processor");

// Short message
logger.debug("Processing started");

// Medium message with data
logger.debug("Processing user registration", {
  userId: 12345,
  email: "user@example.com",
  timestamp: new Date(),
});

// Long message with complex data
logger.debug("Database query result", {
  query: "SELECT * FROM users WHERE created_at > ? AND status = ?",
  params: ["2023-01-01", "active"],
  results: [/* array of user objects */],
  executionTime: 234,
});
```

##### Environment Variable Control

```bash
# Default: 80 characters per log
deno test

# Short: 160 characters - good for overview
LOG_LENGTH=S deno test

# Long: 300 characters - more detail for specific issues
LOG_LENGTH=L deno test

# Whole: Complete output - full debugging information
LOG_LENGTH=W deno test
```

##### Practical Scenarios

1. **Initial Investigation**
   ```bash
   # Start with default to see overall flow
   LOG_LEVEL=debug deno test

   # Output example (30 chars):
   # [DEBUG] [api] Processing user reg...
   # [DEBUG] [db] Executing query: SEL...
   ```

2. **Narrowing Down Issues**
   ```bash
   # Increase to short length for more context
   LOG_LEVEL=debug LOG_LENGTH=S deno test

   # Output example (100 chars):
   # [DEBUG] [api] Processing user registration { userId: 12345, email: "user@example.com", timesta...
   ```

3. **Detailed Analysis**
   ```bash
   # Use long length for specific test files
   LOG_LEVEL=debug LOG_LENGTH=L deno test tests/auth_test.ts

   # Output example (300 chars):
   # [DEBUG] [auth] Validating JWT token { header: { alg: "HS256", typ: "JWT" }, payload: { userId: 12345, exp: 1234567890, iat: 1234567800 }, signature: "abc123...", validationResult: "success" }
   ```

4. **Complete Data Inspection**
   ```bash
   # Use whole length for full object dumps
   LOG_LEVEL=debug LOG_LENGTH=W LOG_KEY=database deno test

   # Output example (complete):
   # [DEBUG] [database] Query execution complete {
   #   query: "SELECT u.*, p.* FROM users u JOIN profiles p ON u.id = p.user_id WHERE u.status = ?",
   #   params: ["active"],
   #   results: [
   #     { id: 1, name: "John Doe", email: "john@example.com", profile: { bio: "Developer", location: "NYC" } },
   #     { id: 2, name: "Jane Smith", email: "jane@example.com", profile: { bio: "Designer", location: "SF" } }
   #   ],
   #   executionTime: 45,
   #   rowCount: 2
   # }
   ```

##### Progressive Debugging Strategy

```bash
# Step 1: Quick overview with default length
LOG_LEVEL=debug deno test

# Step 2: Identify problematic area, increase length
LOG_LEVEL=debug LOG_LENGTH=S deno test

# Step 3: Focus on specific module with more detail
LOG_LEVEL=debug LOG_LENGTH=L LOG_KEY=api,database deno test

# Step 4: Full inspection of specific test
LOG_LEVEL=debug LOG_LENGTH=W LOG_KEY=database deno test tests/db_test.ts
```

##### Message Writing Best Practices

Since messages may be truncated, place the most important information at the
beginning:

```typescript
// Good: Important info first
logger.debug("User login failed: invalid password", {
  userId: 12345,
  attempt: 3,
});
logger.error("Database connection lost: timeout after 30s", {
  host: "db.example.com",
});

// Less optimal: Important info at the end
logger.debug("Processing data with result: failed due to invalid password");
logger.error("Connection to db.example.com failed after timeout of 30s");
```

##### Combining with LOG_KEY

```bash
# Overview of auth flow
LOG_LEVEL=debug LOG_LENGTH=S LOG_KEY=auth deno test

# Detailed database debugging
LOG_LEVEL=debug LOG_LENGTH=W LOG_KEY=database deno test

# Mixed lengths for different modules
LOG_LEVEL=debug LOG_LENGTH=L LOG_KEY=api,cache deno test
```

##### Performance Considerations

- Default (80 chars): Minimal output, fastest processing
- Short (160 chars): Good balance for most debugging
- Long (300 chars): Suitable for complex data structures
- Whole: Use sparingly, can generate very large outputs

##### Common Use Cases by Length

**Default (80 chars)**

- CI/CD pipeline logs
- Quick smoke tests
- High-frequency logging points

**Short (160 chars)**

- General debugging sessions
- Development testing
- Error investigation

**Long (300 chars)**

- API request/response debugging
- Complex state transitions
- Configuration troubleshooting

**Whole (all content)**

- Database query analysis
- Full request payload inspection
- Complete error stack traces

#### Detailed LOG_KEY Use Cases

##### Basic Usage

LOG_KEY is a feature for selectively displaying logs from specific output
locations among multiple logging points. When debugging large applications, you
can view only the logs from areas of interest.

```typescript
// Example usage in test code
const authLogger = new BreakdownLogger("auth");
const dbLogger = new BreakdownLogger("database");
const apiLogger = new BreakdownLogger("api");
const cacheLogger = new BreakdownLogger("cache");

// Log different processes with each logger
authLogger.debug("Validating auth token", { userId: 12345 });
dbLogger.debug("Executing query", { query: "SELECT * FROM users" });
apiLogger.warn("Approaching rate limit", { remaining: 10 });
cacheLogger.debug("Retrieved from cache", { key: "user:12345" });
```

##### Environment Variable Control

```bash
# Show only authentication-related logs
LOG_KEY=auth deno test

# Show only database and cache logs (comma-separated)
LOG_KEY=database,cache deno test

# Specify multiple keys with different delimiters
LOG_KEY=auth:database:api deno test  # Colon-separated
LOG_KEY=auth/database/cache deno test # Slash-separated
```

##### Practical Scenarios

1. **Problem Isolation**
   ```bash
   # When investigating API errors, show only API-related logs
   LOG_LEVEL=debug LOG_KEY=api deno test

   # Investigating database connection issues
   LOG_LEVEL=debug LOG_KEY=database LOG_LENGTH=W deno test
   ```

2. **Progressive Debugging**
   ```bash
   # Step 1: Check error level only
   LOG_LEVEL=error deno test

   # Step 2: Identify problematic modules
   LOG_LEVEL=warn deno test

   # Step 3: Detailed logs for specific modules
   LOG_LEVEL=debug LOG_KEY=auth,api deno test
   ```

3. **Performance Analysis**
   ```bash
   # Check cache hit rate
   LOG_KEY=cache LOG_LENGTH=W deno test

   # Analyze database queries
   LOG_KEY=database LOG_LENGTH=L deno test
   ```

##### Naming Convention Best Practices

- **By Function**: `auth`, `api`, `database`, `cache`
- **By Layer**: `controller`, `service`, `repository`
- **By Process Flow**: `request`, `process`, `response`
- **Maintain Uniqueness**: Don't use the same key in multiple locations

##### Using Default Keys

```typescript
// When no key is specified, "default" key is used
const logger = new BreakdownLogger();
logger.info("Generic log message");

// Show only default key logs
LOG_KEY=default deno test
```

##### Hash Values for Execution Tracking

Hash values provide a powerful way to track specific execution paths, temporary
debugging sessions, and pinpoint error locations without modifying permanent
identifiers.

###### Temporary Debugging Use Cases

1. **Quick Issue Investigation**
   ```typescript
   // Add hash keys for temporary debugging
   const logger = new BreakdownLogger("hash" + Date.now());
   logger.debug("Investigating timeout issue", { context: "user-login" });

   // Or use short hashes for easy typing
   const tempLogger = new BreakdownLogger("h1234");
   tempLogger.debug("Checking state at critical point");
   ```

2. **Test-Specific Debugging**
   ```typescript
   // In test files, use hash for isolated debugging
   Deno.test("complex integration test", () => {
     const debugLogger = new BreakdownLogger("test-5a3f");
     debugLogger.debug("Test setup complete");

     // Run with: LOG_KEY=test-5a3f deno test
   });
   ```

3. **Quick Insertion Points**
   ```typescript
   // Insert temporary logging without disrupting existing keys
   function complexAlgorithm(data: any) {
     const logger = new BreakdownLogger("algo");
     logger.debug("Starting algorithm");

     // Add temporary debug point
     const tempDebug = new BreakdownLogger("h9999");
     tempDebug.debug("Suspicious state here", { data });

     // Remove after debugging
   }
   ```

###### Unique Execution Tracking

1. **Request ID Tracking**
   ```typescript
   // Generate unique ID for each request
   function handleRequest(req: Request) {
     const requestId = crypto.randomUUID().substring(0, 8);
     const logger = new BreakdownLogger(`req-${requestId}`);

     logger.debug("Request received", {
       method: req.method,
       url: req.url,
     });

     // Pass logger through the request lifecycle
     processAuth(req, logger);
     fetchData(req, logger);
     sendResponse(req, logger);
   }

   // Track specific request: LOG_KEY=req-a1b2c3d4 deno test
   ```

2. **Transaction Tracking**
   ```typescript
   // Track database transactions
   async function executeTransaction(operations: Operation[]) {
     const txId = generateHash();
     const txLogger = new BreakdownLogger(`tx-${txId}`);

     txLogger.debug("Transaction started", {
       operationCount: operations.length,
     });

     try {
       for (const op of operations) {
         txLogger.debug("Executing operation", {
           type: op.type,
           table: op.table,
         });
         await op.execute();
       }
       txLogger.debug("Transaction committed");
     } catch (error) {
       txLogger.error("Transaction failed", { error });
       throw error;
     }
   }
   ```

3. **Parallel Process Tracking**
   ```typescript
   // Track parallel executions
   async function processInParallel(items: Item[]) {
     const promises = items.map((item, index) => {
       const processLogger = new BreakdownLogger(`proc-${index}-${Date.now()}`);
       return processItem(item, processLogger);
     });

     await Promise.all(promises);
   }

   // Debug specific process: LOG_KEY=proc-3-1704067200000 deno test
   ```

###### Error Location Identification

1. **Error Path Tracking**
   ```typescript
   // Use hashes to mark potential error points
   function riskyOperation(data: unknown) {
     const logger = new BreakdownLogger("risky-op");

     // Mark critical points with hashes
     const checkpoint1 = new BreakdownLogger("err-cp1");
     checkpoint1.debug("Before validation", { dataType: typeof data });

     if (!validate(data)) {
       const errorLogger = new BreakdownLogger("err-val-fail");
       errorLogger.error("Validation failed", { data });
       throw new Error("Invalid data");
     }

     const checkpoint2 = new BreakdownLogger("err-cp2");
     checkpoint2.debug("Before transformation");

     try {
       return transform(data);
     } catch (e) {
       const errorLogger = new BreakdownLogger("err-transform");
       errorLogger.error("Transformation failed", { error: e });
       throw e;
     }
   }

   // Trace error path: LOG_KEY=err-val-fail,err-cp1,err-cp2 deno test
   ```

2. **Stack-like Error Tracking**
   ```typescript
   // Build error context with hash chain
   class ErrorContext {
     private hashChain: string[] = [];

     push(operation: string): BreakdownLogger {
       const hash = `err-${operation}-${this.hashChain.length}`;
       this.hashChain.push(hash);
       return new BreakdownLogger(hash);
     }

     getChain(): string {
       return this.hashChain.join(",");
     }
   }

   function complexOperation() {
     const ctx = new ErrorContext();

     const log1 = ctx.push("init");
     log1.debug("Initialization phase");

     const log2 = ctx.push("process");
     log2.debug("Processing phase");

     if (errorOccurred) {
       console.error(`Debug with: LOG_KEY=${ctx.getChain()}`);
     }
   }
   ```

3. **Conditional Error Logging**
   ```typescript
   // Use hash keys that activate only on errors
   function criticalFunction(input: any) {
     let errorHash: string | null = null;

     try {
       // Normal processing
       return process(input);
     } catch (error) {
       // Generate hash only on error
       errorHash = `err-${Date.now()}-${
         Math.random().toString(36).substr(2, 9)
       }`;
       const errorLogger = new BreakdownLogger(errorHash);

       errorLogger.error("Critical error occurred", {
         input,
         error,
         stack: error.stack,
         timestamp: new Date().toISOString(),
       });

       // Log the hash for debugging
       console.error(
         `To debug this error, run: LOG_KEY=${errorHash} LOG_LENGTH=W deno test`,
       );

       throw error;
     }
   }
   ```

###### Best Practices for Hash Usage

1. **Naming Patterns**
   - Temporary: `temp-XXXX`, `debug-XXXX`
   - Error tracking: `err-XXXX`, `fail-XXXX`
   - Execution tracking: `exec-XXXX`, `run-XXXX`
   - Request/Transaction: `req-XXXX`, `tx-XXXX`

2. **Hash Generation Strategies**
   ```typescript
   // Time-based
   const timeHash = `debug-${Date.now()}`;

   // Random
   const randomHash = `temp-${Math.random().toString(36).substr(2, 9)}`;

   // Counter-based
   let debugCounter = 0;
   const counterHash = `dbg-${++debugCounter}`;

   // Context-based
   const contextHash = `err-${fileName}-${lineNumber}`;
   ```

3. **Documentation**
   ```typescript
   // Document temporary hashes in code comments
   // DEBUG: Using hash "fix-auth-2024" to track authentication fix
   const debugLogger = new BreakdownLogger("fix-auth-2024");

   // Or maintain a debug hash registry
   const DEBUG_HASHES = {
     "h1001": "Tracking login flow issue #423",
     "h1002": "Database connection timeout investigation",
     "h1003": "Memory leak in cache manager",
   };
   ```

4. **Cleanup Strategy**
   - Remove temporary hash loggers after debugging
   - Convert useful temporary loggers to permanent named loggers
   - Document any hash patterns that become permanent

##### Complex Debugging Examples

```typescript
// Tracking user processing
function processUser(userId: number) {
  const logger = new BreakdownLogger("user-processor");

  logger.debug("Starting processUser", { userId });

  // Authentication check
  const authLogger = new BreakdownLogger("user-auth");
  authLogger.debug("Starting auth check");

  // Data retrieval
  const dbLogger = new BreakdownLogger("user-db");
  dbLogger.debug("Fetching user data", { table: "users", userId });

  // Process completion
  logger.debug("Process completed", { status: "success" });
}

// Track only specific process flows
// LOG_KEY=user-processor,user-auth,user-db deno test
```

### Caller Determination

- Only called from test code
- Does nothing when called from non-test code
  - Implementation should determine how to identify test context

## Distribution Method

- Built for publication to JSR

### Sub-path Import

You can also import the logger directly:

```typescript
import { BreakdownLogger } from "@tettuan/breakdownlogger/logger";
```

### Validate CLI

Scan for accidental `@tettuan/breakdownlogger` imports in non-test files:

```bash
deno run --allow-read jsr:@tettuan/breakdownlogger/validate [target-dir]
```

Exit code 1 if violations found, 0 if clean. Uses `TEST_FILE_PATTERNS` to
exclude test files.

### Other

- Custom formatter support: Not required
- Internationalization: Not required, English only. AI understanding is
  sufficient
- Timezone handling: Not required
- Performance: Not a priority
- Security: Not a priority

### 6. Error Handling

- Logger error handling policy: Error output only
- Log write failure behavior: Not required
- Error notification mechanism: Not required

## Future Extension Considerations

Not required

## Constraints

1. Dependencies
   - Minimize external library dependencies
   - Use only Deno standard library

2. Compatibility
   - Maintain TypeScript/JavaScript compatibility
   - Deno version compatibility requirements

3. Size
   - Bundle size limitation: Minimize as much as possible
   - Memory footprint limitation: Minimize as much as possible

4. Exports
   - Minimal number
