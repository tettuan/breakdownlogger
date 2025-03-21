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

// Change log level dynamically
logger.setLogLevel(LogLevel.DEBUG);
logger.debug("Now this will be logged");
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
new BreakdownLogger(config?: LoggerConfig)
```

#### Methods

- `debug(message: string, data?: unknown): void`
- `info(message: string, data?: unknown): void`
- `warn(message: string, data?: unknown): void`
- `error(message: string, data?: unknown): void`
- `setLogLevel(level: LogLevel): void`

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

### LoggerConfig

Configuration interface:

```typescript
interface LoggerConfig {
  initialLevel?: LogLevel;
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
