# BreakdownLogger User Guide

> **Related**: [日本語版](usage.ja.md) | [API Specification](index.md) |
> [Glossary](glossary.ja.md)

## Quick Start

### Installation

Import from JSR in your Deno project:

```typescript
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
```

### Your First Log

BreakdownLogger is designed exclusively for test files. Create a file ending in
`_test.ts` and add logging:

```typescript
// example_test.ts
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

Deno.test("my first logged test", () => {
  const logger = new BreakdownLogger("example");
  logger.info("Test is running");
  logger.debug("Detailed state", { step: 1, status: "ok" });
});
```

Run it with debug output enabled:

```bash
LOG_LEVEL=debug deno test --allow-env --allow-read --allow-write example_test.ts
```

## Basic Usage

### Log Levels

BreakdownLogger provides four log levels, listed from most verbose to least:

| Level   | When to Use                                            |
| ------- | ------------------------------------------------------ |
| `DEBUG` | Detailed internal state, variable values, flow tracing |
| `INFO`  | General progress milestones (default level)            |
| `WARN`  | Unexpected but recoverable situations                  |
| `ERROR` | Failures that need investigation                       |

Each level includes all levels above it. Setting `LOG_LEVEL=warn` shows WARN and
ERROR but hides DEBUG and INFO. The default level when `LOG_LEVEL` is not set is
INFO.

```typescript
const logger = new BreakdownLogger("auth");

logger.debug("Token payload decoded", { sub: "user-42", exp: 1700000000 });
logger.info("Authentication succeeded");
logger.warn("Token expires in less than 60 seconds", { remaining: 45 });
logger.error("Token signature verification failed", { alg: "HS256" });
```

### Output Location KEY

The KEY is a string you assign when creating a logger. It identifies where a log
message originates, so you can filter output to only the parts of the system you
care about.

```typescript
const authLogger = new BreakdownLogger("auth");
const dbLogger = new BreakdownLogger("database");
const cacheLogger = new BreakdownLogger("cache");
```

Each logger tags its output with its KEY. When your test suite produces hundreds
of log lines, you use `LOG_KEY` to see only the ones that matter right now.

### Default KEY

When you create a logger without specifying a key, it uses `"default"`:

```typescript
const logger = new BreakdownLogger(); // key is "default"
logger.info("Using the default key");
```

You can filter for default-key logs with `LOG_KEY=default`.

## Environment Variables

All configuration is done through environment variables, set before the
`deno test` command. No code changes are needed to adjust output.

### LOG_LEVEL

Controls the minimum severity of messages that are displayed.

| Value   | Shows                       |
| ------- | --------------------------- |
| `debug` | DEBUG, INFO, WARN, ERROR    |
| `info`  | INFO, WARN, ERROR (default) |
| `warn`  | WARN, ERROR                 |
| `error` | ERROR only                  |

```bash
LOG_LEVEL=debug deno test --allow-env
LOG_LEVEL=error deno test --allow-env
```

### LOG_LENGTH

Controls how many characters of each log message are displayed before
truncation.

| Value   | Max Length     | Best For                        |
| ------- | -------------- | ------------------------------- |
| (unset) | 80 characters  | CI pipelines, quick scans       |
| `S`     | 160 characters | General debugging sessions      |
| `L`     | 300 characters | API payloads, complex state     |
| `W`     | No limit       | Full object dumps, stack traces |

When a message exceeds the limit, it is cut off and `...` is appended.

```bash
LOG_LEVEL=debug LOG_LENGTH=S deno test --allow-env
LOG_LEVEL=debug LOG_LENGTH=W deno test --allow-env
```

### LOG_KEY

Filters output to only show logs from loggers whose KEY matches. Accepts one or
more keys separated by commas, colons, or slashes.

```bash
# Single key
LOG_KEY=auth deno test --allow-env

# Multiple keys -- all three delimiter styles are equivalent
LOG_KEY=auth,database deno test --allow-env
LOG_KEY=auth:database deno test --allow-env
LOG_KEY=auth/database deno test --allow-env
```

When `LOG_KEY` is not set, all keys are shown.

## Output Format

### Basic Format

A message without data produces a single line:

```
[LEVEL] [key] message
```

Example:

```
[INFO] [auth] User login succeeded
```

### With Data

When you pass a second argument (the `data` parameter), the output includes the
serialized data and a timestamp:

```
[LEVEL] [key] message
Data: {
  "field": "value"
}
Timestamp: 2025-01-15T09:30:00.000Z
```

The timestamp is in ISO 8601 format and only appears when data is present. Data
objects are serialized as pretty-printed JSON.

Note: the entire output (including data and timestamp lines) counts toward the
`LOG_LENGTH` truncation limit.

## Practical Use Cases

### Step-by-Step Debugging

Start broad, then narrow down to the source of the problem:

```bash
# Step 1: See errors only -- identify which test fails
LOG_LEVEL=error deno test --allow-env

# Step 2: Add warnings -- look for suspicious conditions
LOG_LEVEL=warn deno test --allow-env

# Step 3: Full debug output for the module that looks wrong
LOG_LEVEL=debug LOG_KEY=payment deno test --allow-env

# Step 4: Remove truncation for complete data inspection
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=W deno test --allow-env
```

### Function Call Tracing

Place loggers at the boundaries of function calls to trace data flow:

```typescript
// payment_service_test.ts
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

const logger = new BreakdownLogger("payment");

Deno.test("charge processes correctly", async () => {
  const order = { id: "ord-99", amount: 2500, currency: "USD" };

  // Before the call -- log what you are about to send
  logger.debug("Calling chargeCustomer", order);

  const result = await chargeCustomer(order);

  // After the call -- log what you got back
  logger.debug("chargeCustomer returned", result);

  // Before a subsequent call
  logger.debug("Calling saveReceipt", { orderId: order.id });

  await saveReceipt(order.id, result);

  // After completion
  logger.info("Payment flow completed", { orderId: order.id });
});
```

Run with:

```bash
LOG_LEVEL=debug LOG_KEY=payment deno test --allow-env payment_service_test.ts
```

### Problem Isolation with LOG_KEY

When a test file exercises multiple subsystems, give each its own logger and
filter to the one you need:

```typescript
// integration_test.ts
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

const authLog = new BreakdownLogger("auth");
const dbLog = new BreakdownLogger("database");
const cacheLog = new BreakdownLogger("cache");

Deno.test("user registration integration", async () => {
  authLog.debug("Hashing password", { algorithm: "bcrypt", rounds: 10 });
  const hash = await hashPassword("secret");

  dbLog.debug("Inserting user record", { table: "users", email: "a@b.com" });
  const userId = await insertUser({ email: "a@b.com", hash });

  cacheLog.debug("Warming user cache", { userId });
  await warmCache(userId);

  authLog.info("Registration complete", { userId });
});
```

```bash
# Only see database activity
LOG_LEVEL=debug LOG_KEY=database deno test --allow-env integration_test.ts

# See auth and cache together
LOG_LEVEL=debug LOG_KEY=auth,cache deno test --allow-env integration_test.ts
```

## Best Practices

### Naming KEYs

Choose keys that let you filter effectively:

- **By feature**: `auth`, `payment`, `notification`, `search`
- **By layer**: `controller`, `service`, `repository`
- **Keep them unique**: avoid reusing the same key for unrelated modules,
  because `LOG_KEY` filtering cannot distinguish between them

For temporary investigation, use a short unique tag like `fix-123` or `tmp-abc`
so you can filter precisely, then remove it when done.

### Message Content

Because messages may be truncated (default at 80 characters), put the most
important information at the beginning:

```typescript
// Good -- the critical fact comes first
logger.debug("Timeout: connection to DB exceeded 30s", { host: "db.prod" });

// Less useful when truncated -- the key detail is at the end
logger.debug("Attempting to establish connection which timed out after 30s");
```

### Combining Environment Variables

Use all three variables together for precise control:

```bash
# Broad overview: default truncation, all keys, only warnings+
LOG_LEVEL=warn deno test --allow-env

# Focused session: one module, more detail
LOG_LEVEL=debug LOG_LENGTH=S LOG_KEY=auth deno test --allow-env

# Deep inspection: full output for one module in one test file
LOG_LEVEL=debug LOG_LENGTH=W LOG_KEY=database deno test --allow-env tests/db_test.ts
```

This progressive approach keeps noise low during early investigation and gives
you full detail exactly where you need it.
