# BreakdownLogger: Strategic Debugging Guide

> **Related**: [日本語版](usage.ja.md) | [API Specification](index.md) |
> [Glossary](glossary.ja.md)

## 1. Design Philosophy

BreakdownLogger answers "what is happening inside my code?" during test development by providing environment-controlled debug output that activates only in test contexts.

Three principles:

- **Test-only**: Output is produced only from test files (`*_test.ts`, `*.test.ts`), enforced by stack trace inspection at construction time.
- **Environment-controlled**: All configuration via `LOG_LEVEL`, `LOG_LENGTH`, `LOG_KEY` -- change the command, not the code.
- **Zero overhead**: Outside test context, every method call returns immediately with no conditional logic needed in application code.

### Three Control Dimensions

| Dimension | Variable     | Controls         | Values                           |
| --------- | ------------ | ---------------- | -------------------------------- |
| Level     | `LOG_LEVEL`  | Severity filter  | `debug`, `info`, `warn`, `error` |
| Length    | `LOG_LENGTH` | Truncation limit | (unset), `S`, `L`, `W`           |
| Key       | `LOG_KEY`    | Component filter | Comma/colon/slash-separated      |

Level decides _what severity_, Length decides _how much_, Key decides _which components_ -- together they go from suite overview to single-module data dump without touching source code.

## 2. Quick Start

```typescript
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

// example_test.ts
Deno.test("my first logged test", () => {
  const logger = new BreakdownLogger("example");
  logger.info("Test is running");
  logger.debug("Detailed state", { step: 1, status: "ok" });
});
```

```bash
LOG_LEVEL=debug deno test --allow-env --allow-read --allow-write example_test.ts
```

## 3. Configuration Reference

### Constructor

```typescript
new BreakdownLogger(key?: string)
```

`key` identifies this logger instance for output labeling and `LOG_KEY` filtering. Defaults to `"default"`. Environment variables are cached at construction time.

**Methods:** `debug`, `info`, `warn`, `error` -- all share signature `(message: string, data?: unknown): void`.

### LOG_LEVEL

| Value   | Shown                    | Use case                               |
| ------- | ------------------------ | -------------------------------------- |
| `debug` | DEBUG, INFO, WARN, ERROR | Full trace during active investigation |
| `info`  | INFO, WARN, ERROR        | Default; general progress and problems |
| `warn`  | WARN, ERROR              | Focus on suspicious conditions         |
| `error` | ERROR only               | Identify failures with minimal noise   |

Default: `info`. DEBUG/INFO/WARN go to **stdout** (`console.log`), ERROR goes to **stderr** (`console.error`), enabling `2>error.log` separation.

### LOG_LENGTH

| Value   | Max chars | When to use                          |
| ------- | --------- | ------------------------------------ |
| (unset) | 80        | CI, quick scans, high-frequency logs |
| `S`     | 160       | General debugging                    |
| `L`     | 300       | API payloads, complex state          |
| `W`     | Unlimited | Full dumps, root-cause analysis      |

Truncation appends `...` (3 chars counted toward limit) and applies to the entire formatted output including Data and Timestamp lines.

### LOG_KEY

Filters to loggers whose key exactly matches one of the specified values (comma/colon/slash-delimited). `LOG_KEY=auth` will not match `auth-module`. When unset, all keys are shown.

```bash
LOG_KEY=auth,database deno test --allow-env
```

### FORCE_TEST_MODE

`FORCE_TEST_MODE=true` bypasses test-context detection for debugging the logger outside test files, non-standard test environments, or REPL use. Do not set in production.

### Output Format

Without data: `[LEVEL] [key] message`
With data:

```
[LEVEL] [key] message
Data: { "field": "value" }
Timestamp: 2025-01-15T09:30:00.000Z
```

Timestamp appears only when `data` is provided. Data is serialized via `JSON.stringify(data, null, 2)`. Circular references fall back to `[Object: toString()]`. The entire formatted string is subject to `LOG_LENGTH` truncation.

## 4. Strategic Debugging Workflow

Debug broad-to-narrow-to-deep to avoid drowning in output while reaching root cause.

**Phase 1 -- Overview**: Identify failure locations with errors only.

```bash
LOG_LEVEL=error deno test --allow-env
```

**Phase 2 -- Isolation**: Filter to the suspected component with truncated output.

```bash
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=S deno test --allow-env
```

**Phase 3 -- Deep Inspection**: Remove truncation on a single test file for full data.

```bash
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=W deno test --allow-env tests/payment_test.ts
```

### Decision Guide

| Symptom                  | Action                                        |
| ------------------------ | --------------------------------------------- |
| Too much output          | Add `LOG_KEY` to filter to one component      |
| Message truncated (`...`)| Increase `LOG_LENGTH`: `S` → `L` → `W`       |
| Need more detail         | Add `data` parameter to log calls             |
| Error in one test file   | Specify file path after `deno test`           |

## 5. Logger Placement

Place loggers at data transformation/transfer boundaries to maximize diagnostic value:

1. **After receiving arguments** -- confirms what the function actually received
2. **Before returning values** -- captures the final answer before leaving scope
3. **Before/after external calls** -- brackets dependency boundaries (DB, API, filesystem)
4. **Inside error handlers** -- captures error object and context at catch point

```typescript
async function processOrder(order: Order): Promise<Receipt> {
  const logger = new BreakdownLogger("order");
  logger.debug("processOrder called", order);                    // 1
  logger.debug("Calling paymentGateway.charge", { orderId: order.id }); // 3
  try {
    const charge = await paymentGateway.charge(order);
    logger.debug("paymentGateway.charge returned", charge);      // 3
  } catch (err) {
    logger.error("paymentGateway.charge failed", { orderId: order.id, error: err }); // 4
    throw err;
  }
  logger.debug("processOrder returning", receipt);               // 2
  return receipt;
}
```

Front-load critical information in messages because truncation cuts from the end. Use `message` for "what happened", `data` for structured details. Avoid passing objects with circular references as data -- extract relevant fields first.

## 6. Operational Rules

### KEY Naming

Choose one consistent scheme per project to enable effective `LOG_KEY` filtering:

| Scheme   | Example keys                                  | Best for                   |
| -------- | --------------------------------------------- | -------------------------- |
| Feature  | `auth`, `payment`, `notification`             | User-facing feature debug  |
| Layer    | `controller`, `service`, `repository`         | Architectural flow debug   |
| Flow     | `order-auth`, `order-stock`, `order-payment`  | Cross-subsystem tracing    |

Keep keys unique per logical component. For large projects, use prefixes as namespaces (`auth-token`, `auth-session`).

### Temporary Investigation

Use a unique tag (e.g., `fix-423`) to avoid colliding with permanent keys, then remove it after investigation.

```bash
LOG_LEVEL=debug LOG_KEY=fix-423 deno test --allow-env
```

### CI Integration

Default to `LOG_LEVEL=error` in CI for minimal noise; expand to `LOG_LEVEL=debug LOG_LENGTH=L` only when investigating failures. ERROR/stderr separation naturally highlights failures in CI systems.

## 7. Execution Patterns

```bash
# Single test file
LOG_LEVEL=debug deno test --allow-env --allow-read --allow-write tests/auth_test.ts

# Full suite debug
LOG_LEVEL=debug deno test --allow-env --allow-read --allow-write

# Filtered by key(s)
LOG_LEVEL=debug LOG_KEY=auth,database deno test --allow-env --allow-read --allow-write

# CI error-only
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write

# Progressive narrowing (run in order)
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write
LOG_LEVEL=warn deno test --allow-env --allow-read --allow-write
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=S deno test --allow-env --allow-read --allow-write
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=L deno test --allow-env --allow-read --allow-write
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=W deno test --allow-env --allow-read --allow-write tests/payment_test.ts
```

## 8. Output Understanding

### Stream Routing

| Level | Stream | Function        |
| ----- | ------ | --------------- |
| DEBUG | stdout | `console.log`   |
| INFO  | stdout | `console.log`   |
| WARN  | stdout | `console.log`   |
| ERROR | stderr | `console.error` |

BreakdownLogger does not write to files. Use shell redirection to capture: `2>&1 | tee debug.log` for all, or `> stdout.log 2> stderr.log` to separate errors.

### Truncation Tiers

When `...` appears, increase `LOG_LENGTH` one tier: (unset) 80 → `S` 160 → `L` 300 → `W` unlimited.

Timestamps (ISO 8601) appear only when `data` is provided, keeping trace messages compact.

## 9. Practical Examples

### Function Call Tracing

Use separate keys for caller/callee to trace data across boundaries:

```typescript
const callerLog = new BreakdownLogger("order-caller");
const serviceLog = new BreakdownLogger("order-service");
```

```bash
LOG_LEVEL=debug LOG_KEY=order-caller,order-service deno test --allow-env --allow-read --allow-write
```

### Multi-Module Isolation

Assign each subsystem its own logger and filter with `LOG_KEY`:

```typescript
const authLog = new BreakdownLogger("auth");
const dbLog = new BreakdownLogger("database");
const cacheLog = new BreakdownLogger("cache");
```

```bash
LOG_LEVEL=debug LOG_KEY=database deno test --allow-env --allow-read --allow-write integration_test.ts
```

### Dynamic Key Request Tracking

Generate unique keys per request (`prefix-uuid`) to trace one execution among concurrent runs. First run with `LOG_LEVEL=info` to discover keys, then re-run with `LOG_KEY=req-<id> LOG_LENGTH=W` to inspect one specific request.

## 10. Claude Code Skills

Export two Claude Code skills to consuming projects via docs CLI:

```bash
deno run -A jsr:@tettuan/breakdownlogger/docs
```

| Skill | File | Purpose |
| --- | --- | --- |
| `breakdownlogger-implement-logger` | `.claude/skills/breakdownlogger-implement-logger/SKILL.md` | KEY naming, boundary placement, validation |
| `breakdownlogger-debug-with-logger` | `.claude/skills/breakdownlogger-debug-with-logger/SKILL.md` | 3-phase debugging workflow with LOG_LEVEL/KEY/LENGTH |

After export, available as `/breakdownlogger-implement-logger` and `/breakdownlogger-debug-with-logger` in Claude Code sessions.

## 11. Production Usage Detection

The validate tool scans non-test files for `@tettuan/breakdownlogger` imports (static, dynamic, subpath, re-export) to catch forgotten debug imports that silently do nothing in production.

```bash
deno run --allow-read jsr:@tettuan/breakdownlogger/validate ./src
```

Exit code 1 on violations, 0 if clean. Catches all import forms because even wrapper files must import from the root package. Add to CI pipeline after tests pass.
