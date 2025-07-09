# BreakdownLogger

[![JSR](https://jsr.io/badges/@tettuan/breakdownlogger)](https://jsr.io/@tettuan/breakdownlogger)
[![JSR Score](https://jsr.io/badges/@tettuan/breakdownlogger/score)](https://jsr.io/@tettuan/breakdownlogger)

A debugging logger library built with Deno and published to JSR. It is designed
to be used within test environments and provides structured logging with
configurable levels and filtering.

## Overview

BreakdownLogger is a logging system designed to assist with debugging
application configuration and path resolution. It outputs only to standard
output (or standard error) when executed from test code, without writing to log
files.

## Features

- 🎯 **Test-only execution**: Works exclusively in test environments for
  security
- 📊 **Hierarchical log levels**: DEBUG, INFO, WARN, ERROR with proper filtering
- ⚙️ **Environment variable configuration**: Zero-code setup via env vars
- ✂️ **Message truncation control**: Configurable output length (LOG_LENGTH)
- 🔍 **Key-based filtering**: Filter logs by component/module (LOG_KEY)
- 🚀 **Zero external dependencies**: Pure Deno implementation
- 📝 **Structured data support**: JSON serialization of complex objects

## Installation

### From JSR (Recommended)

```typescript
import { BreakdownLogger, LogLevel } from "jsr:@tettuan/breakdownlogger";
```

### With specific version

```typescript
import { BreakdownLogger, LogLevel } from "jsr:@tettuan/breakdownlogger@^1.0.8";
```

## Usage

### Important Guidelines

1. **Test-Only Usage**
   - This logger is designed exclusively for test environments
   - Only works when called from test files (*_test.ts, *.test.ts, etc.)
   - Does nothing when called from regular application code
   - It's optimized for debugging test scenarios

2. **Strategic Debugging Points**

   When calling the logger, the following are considered important debugging
   points:
   - Before function calls
   - Immediately after receiving arguments
   - Just before return values
   - Immediately after receiving return values
   - Before and after important processing operations

3. **Environment Variable Control**

   Since LOG_LEVEL alone may provide too much information, use these features to
   control output:
   - **LOG_LEVEL**: Control which log levels are displayed
   - **LOG_LENGTH**: Control message truncation for readability
   - **LOG_KEY**: Filter logs by specific output locations

### Basic Usage

```typescript
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@1.0.4";

// Create logger with a unique key for filtering
const logger = new BreakdownLogger("auth-module");

// Use default logger (key will be "default")
const defaultLogger = new BreakdownLogger();

// Log at different levels
logger.debug("Debug information", { userId: 123 });
logger.info("Process started");
logger.warn("Rate limit approaching", { remaining: 10 });
logger.error("Authentication failed", { reason: "Invalid token" });
```

### Environment Variable Configuration

BreakdownLogger supports three environment variables to control logging
behavior:

#### LOG_LEVEL - Control what logs are displayed

Controls which log levels are output. Only logs at or above the specified level
will be displayed.

```bash
# Run with DEBUG level (most verbose)
LOG_LEVEL=debug deno test --allow-env

# Run with INFO level (default)
LOG_LEVEL=info deno test --allow-env

# Run with WARN level
LOG_LEVEL=warn deno test --allow-env

# Run with ERROR level (least verbose)
LOG_LEVEL=error deno test --allow-env
```

**Log Level Hierarchy:**

- DEBUG: Shows all logs (DEBUG, INFO, WARN, ERROR)
- INFO: Shows INFO, WARN, ERROR (default when LOG_LEVEL not set)
- WARN: Shows only WARN and ERROR
- ERROR: Shows only ERROR

#### LOG_LENGTH - Control message truncation

Controls how log messages are truncated for better readability. This is
essential for balancing between having enough information for debugging and
keeping the overall output readable.

- **Default** (unset): Truncates at 80 characters
- **S** (SHORT): Truncates at 160 characters
- **L** (LONG): Truncates at 300 characters
- **W** (WHOLE): No truncation - displays complete messages

```bash
# Examples
LOG_LEVEL=debug deno test
LOG_LEVEL=debug LOG_LENGTH=S deno test tests/package/*
LOG_LEVEL=debug LOG_LENGTH=L deno test tests/package/a_file_test.ts
LOG_LEVEL=debug LOG_LENGTH=W LOG_KEY=database deno test tests/package/a_file_test.ts
```

**Progressive Debugging Strategy:**

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

**Common Use Cases by Length:**

- **Default (80 chars)**: CI/CD pipeline logs, quick smoke tests, high-frequency
  logging points
- **Short (160 chars)**: General debugging sessions, development testing, error
  investigation
- **Long (300 chars)**: API request/response debugging, complex state
  transitions, configuration troubleshooting
- **Whole (all content)**: Database query analysis, full request payload
  inspection, complete error stack traces

**Message Writing Best Practice:**

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

#### LOG_KEY - Filter logs by output location

Allows selective display of logs from specific output locations. When debugging
large applications, you can view only the logs from areas of interest.

```bash
# Show only auth-related logs
LOG_KEY=auth deno test --allow-env

# Show multiple keys (comma, colon, or slash separated)
LOG_KEY=database,cache deno test --allow-env
LOG_KEY=auth:database:api deno test --allow-env
LOG_KEY=auth/database/cache deno test --allow-env
```

**Basic Usage:**

```typescript
// Create loggers with unique keys
const authLogger = new BreakdownLogger("auth");
const dbLogger = new BreakdownLogger("database");
const apiLogger = new BreakdownLogger("api");
const cacheLogger = new BreakdownLogger("cache");

// Log different processes
authLogger.debug("Validating auth token", { userId: 12345 });
dbLogger.debug("Executing query", { query: "SELECT * FROM users" });
apiLogger.warn("Approaching rate limit", { remaining: 10 });
cacheLogger.debug("Retrieved from cache", { key: "user:12345" });
```

**Practical Scenarios:**

1. **Problem Isolation**
   ```bash
   # Investigating API errors
   LOG_LEVEL=debug LOG_KEY=api deno test

   # Database connection issues
   LOG_LEVEL=debug LOG_KEY=database LOG_LENGTH=W deno test
   ```

2. **Progressive Debugging**
   ```bash
   # Step 1: Check error level only
   LOG_LEVEL=error deno test

   # Step 2: Find problematic modules
   LOG_LEVEL=warn deno test

   # Step 3: Detailed logs for specific modules
   LOG_LEVEL=debug LOG_KEY=auth,api deno test
   ```

**Using Hash Keys for Temporary Debugging:**

```typescript
// Quick debugging with temporary hash keys
const tempLogger = new BreakdownLogger("h1234");
tempLogger.debug("Investigating timeout issue");

// Run with: LOG_KEY=h1234 deno test

// Track specific execution with unique ID
const requestId = crypto.randomUUID().substring(0, 8);
const requestLogger = new BreakdownLogger(`req-${requestId}`);
requestLogger.debug("Request received", { method: req.method });

// Debug specific request: LOG_KEY=req-a1b2c3d4 deno test
```

### Advanced Usage Examples

#### Combining Environment Variables

```bash
# Overview of auth flow with short messages
LOG_LEVEL=debug LOG_LENGTH=S LOG_KEY=auth deno test

# Detailed database debugging with full output
LOG_LEVEL=debug LOG_LENGTH=W LOG_KEY=database deno test

# Focus on specific modules with long messages
LOG_LEVEL=debug LOG_LENGTH=L LOG_KEY=api,cache deno test
```

#### Complex Debugging Example

```typescript
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@1.0.4";

Deno.test("User processing test", async () => {
  const mainLogger = new BreakdownLogger("user-processor");
  const authLogger = new BreakdownLogger("user-auth");
  const dbLogger = new BreakdownLogger("user-db");

  mainLogger.debug("Starting user processing", { userId: 123 });

  // Authentication phase
  authLogger.debug("Checking user credentials");
  const authResult = await authenticate(userId);
  authLogger.debug("Auth result", authResult);

  // Database operations
  dbLogger.debug("Fetching user data", { table: "users", userId });
  const userData = await fetchUser(userId);
  dbLogger.debug("User data retrieved", userData);

  mainLogger.debug("Processing complete", { status: "success" });
});

// Debug only auth flow: LOG_KEY=user-auth deno test
// Debug entire process: LOG_KEY=user-processor,user-auth,user-db deno test
```

#### Error Tracking with Hash Keys

```typescript
// Use hash keys to mark potential error points
function riskyOperation(data: unknown) {
  const logger = new BreakdownLogger("risky-op");

  // Mark critical checkpoints
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

### Test Environment Setup

```bash
# Run tests with DEBUG level logging
LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read

# Run specific test file with INFO level
LOG_LEVEL=info deno test --allow-env --allow-write --allow-read specific_test.ts

# Run with default INFO level (no environment variable needed)
deno test --allow-env --allow-write --allow-read
```

### Examples Directory

The `example/` directory contains practical usage examples:

- `basic_usage.ts` - Simple usage demonstration
- `test_environment.ts` - Basic logger usage in test scenarios
- `advanced_usage_test.ts` - Advanced patterns and debugging techniques
- `security_demo_test.ts` - Demonstrates why this logger is test-only

To run examples:

```bash
# Run all examples
LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read example/

# Run specific example
LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read example/test_environment.ts
```

## API Reference

### BreakdownLogger

The main logger class that provides structured logging with environment-based
filtering.

#### Constructor

```typescript
new BreakdownLogger(key?: string)
```

- `key` (optional): Unique identifier for this logger instance. Used for
  filtering with LOG_KEY. Defaults to "default" if not provided.

#### Methods

- `debug(message: string, data?: unknown): void` - Log debug information
- `info(message: string, data?: unknown): void` - Log general information
- `warn(message: string, data?: unknown): void` - Log warnings
- `error(message: string, data?: unknown): void` - Log errors

### LogLevel

Enum for log levels:

```typescript
enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}
```

### Output Format

```
[timestamp] [LEVEL] [key] message
Data: { optional data object }
```

Example:

```
[2024-03-10T12:00:00.000Z] [DEBUG] [auth] User login attempt
Data: { userId: 12345, ip: "192.168.1.100" }
```

## Development Scripts

The project includes two utility scripts to help with development and
publishing:

### Publishing Process

#### 1. Local Preparation (`scripts/publish.sh`)

This script prepares your local changes for publishing:

```bash
./scripts/publish.sh
```

The script:

- Checks for uncommitted changes
- Verifies GitHub Actions workflow status
- Regenerates `deno.lock` file
- Runs format, lint, and test checks
- Commits and pushes the updated `deno.lock`

#### 2. Version Management (`scripts/bump_version.sh`)

This script handles version bumping and tag creation:

```bash
./scripts/bump_version.sh
```

The script:

- Verifies GitHub Actions workflow status
- Checks latest version from JSR
- Removes any GitHub tags newer than the JSR version
- Increments the patch version
- Updates `deno.json`
- Creates and pushes a new version tag

Typical publishing workflow:

1. Make your changes
2. Run `./scripts/publish.sh` to prepare
3. Run `./scripts/bump_version.sh` to create a new version
4. The GitHub Actions workflow will automatically publish to JSR

## License

MIT License - see [LICENSE](./LICENSE) for details.
