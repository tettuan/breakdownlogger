# BreakdownLogger

A simple, lightweight logging utility for Deno test environments. This logger is designed to help debug application configuration and path resolution during testing.

## Features

- Multiple log levels (DEBUG, INFO, WARN, ERROR)
- Environment variable configuration
- Optional data object logging
- Timestamp-based logging
- Test-focused design

## Installation

```typescript
import { BreakdownLogger, LogLevel } from "jsr:@tettuan/breakdownlogger";
```

## Usage

### Basic Usage

```typescript
import { BreakdownLogger, LogLevel } from "jsr:@tettuan/breakdownlogger";

const logger = new BreakdownLogger();

logger.info("Application started");
logger.debug("Debug information", { someData: "value" });
logger.warn("Warning message");
logger.error("Error occurred", new Error("Something went wrong"));
```

### Configuration

#### Environment Variable

Set the log level using the `LOG_LEVEL` environment variable:

```bash
LOG_LEVEL=debug deno test
```

Available levels: `debug`, `info`, `warn`, `error`

#### Programmatic Configuration

```typescript
const logger = new BreakdownLogger({
  initialLevel: LogLevel.DEBUG
});

// Change log level at runtime
logger.setLogLevel(LogLevel.WARN);
```

### Output Format

Logs are formatted as follows:

```
[2024-03-20T12:34:56.789Z] [INFO] Your message
データ: {
  "key": "value"
}
```

## Testing

Run tests with:

```bash
deno task test        # Run tests
deno task test:watch  # Run tests in watch mode
deno task test:debug  # Run tests with debug logging
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 