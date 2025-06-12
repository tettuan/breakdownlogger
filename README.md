# BreakdownLogger

A debug logging library for Deno applications, designed specifically for test
environments and debugging purposes.

## Features

- Hierarchical log levels (DEBUG, INFO, WARN, ERROR)
- Environment variable configuration
- Structured data output
- Dynamic log level control
- Test environment optimization

## Installation

```typescript
import { BreakdownLogger, LogLevel } from "jsr:@tettuan/breakdownlogger@0.1.0";
```

## Usage

### Important Guidelines

1. **Test-Only Usage**
   - This logger is designed exclusively for test environments
   - Do not use it in application code
   - It's optimized for debugging test scenarios

   **Why Test-Only?**
   - The logger is specifically designed to aid in debugging during test
     development
   - It provides verbose output that would be inappropriate for production
     environments
   - The logging overhead is acceptable in test scenarios but not in production
   - Security: Debug logs may expose sensitive data that should never appear in
     production logs

   **Test Environment Setup**
   ```bash
   # Run tests with DEBUG level logging
   LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read

   # Run specific test file with INFO level
   LOG_LEVEL=info deno test --allow-env --allow-write --allow-read specific_test.ts

   # Run with default INFO level (no environment variable needed)
   deno test --allow-env --allow-write --allow-read
   ```

   **Using the Examples Directory** The `example/` directory contains practical
   usage examples:
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

2. **Log Level Management**
   - Set log level explicitly for each test run
   - While `.env` configuration is supported, avoid using DEBUG level in `.env`
     due to excessive output
   - Recommended: Set log level via command line for specific test runs

3. **Strategic Checkpoints** Place logging statements at key points:
   - Before and after function calls
   - Before and after parameter processing
   - Before and after return value handling
   - Before and after data transformations

### Basic Usage

```typescript
import { BreakdownLogger, LogLevel } from "jsr:@tettuan/breakdownlogger@0.1.0";

const logger = new BreakdownLogger();

// Default log level is INFO
logger.debug("This won't be logged");
logger.info("This will be logged");
logger.warn("This will be logged");
logger.error("This will be logged");

// Log with structured data
logger.info("User data", { id: 123, name: "Test User" });
```

### Environment Variable Configuration

Set the `LOG_LEVEL` environment variable to control the log level:

```bash
# Run with DEBUG level
LOG_LEVEL=debug deno run -A your_script.ts

# Run with WARN level
LOG_LEVEL=warn deno run -A your_script.ts
```

### Test Environment Usage

```typescript
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@0.1.0";

Deno.test("My test", async (t) => {
  const logger = new BreakdownLogger();

  await t.step("test case", () => {
    logger.debug("Test data", { input: "test" });
    // ... test implementation
  });
});
```

## API Reference

### BreakdownLogger

The main logger class.

#### Constructor

```typescript
new BreakdownLogger(key?: string)
```

#### Methods

- `debug(message: string, data?: unknown): void`
- `info(message: string, data?: unknown): void`
- `warn(message: string, data?: unknown): void`
- `error(message: string, data?: unknown): void`

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

## Examples

See the [examples](./example) directory for detailed usage examples.

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
