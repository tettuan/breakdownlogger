# BreakdownLogger: Strategic Debugging Guide

> **Related**: [日本語版](usage.ja.md) | [API Specification](index.md) |
> [Glossary](glossary.ja.md)

## 1. Introduction and Design Philosophy

BreakdownLogger is a debug logging library for Deno test environments. It exists
to answer one question during test development: "What is actually happening
inside my code right now?"

Three design principles shape every decision in the library:

- **Test-only**: Output is produced only when called from test files
  (`*_test.ts`, `*.test.ts`). Code in production modules that instantiates a
  logger silently does nothing. This is enforced by stack trace inspection at
  construction time.
- **Environment-controlled**: All configuration is done through environment
  variables (`LOG_LEVEL`, `LOG_LENGTH`, `LOG_KEY`). Adjusting verbosity or focus
  requires zero code changes -- you change the command you run, not the code you
  wrote.
- **Zero overhead**: When the logger detects it is not in a test context, every
  method call returns immediately. There is no conditional logic in your
  application code; the logger handles it internally.

### The Three Control Dimensions

BreakdownLogger gives you three orthogonal controls that multiply together for
precise output:

| Dimension | Variable     | Controls         | Values                           |
| --------- | ------------ | ---------------- | -------------------------------- |
| Level     | `LOG_LEVEL`  | Severity filter  | `debug`, `info`, `warn`, `error` |
| Length    | `LOG_LENGTH` | Truncation limit | (unset), `S`, `L`, `W`           |
| Key       | `LOG_KEY`    | Component filter | Comma/colon/slash-separated      |

Level decides _what severity_ you see. Length decides _how much_ of each message
you see. Key decides _which components_ you see. Together they let you go from a
high-level overview of your entire test suite down to a full data dump of a
single module, without touching any source code.

## 2. Quick Start

### Installation

Import from JSR in your Deno project:

```typescript
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
```

### Your First Log

Create a test file (the filename must end in `_test.ts` or `.test.ts`):

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

You will see output only when `LOG_LEVEL` is set, because the default level is
`info` and `debug` messages are below that threshold.

## 3. Configuration Reference

### Constructor

```typescript
new BreakdownLogger(key?: string)
```

- `key` -- A string that identifies this logger instance. Used as the output
  location label and as the filter target for `LOG_KEY`. Defaults to `"default"`
  when omitted.

Each logger reads environment variables at construction time and caches the
values. If you need different configurations within the same test run, that is
handled by using different keys, not by changing variables mid-run.

**Methods:**

- `debug(message: string, data?: unknown): void` -- Log at DEBUG level
- `info(message: string, data?: unknown): void` -- Log at INFO level
- `warn(message: string, data?: unknown): void` -- Log at WARN level
- `error(message: string, data?: unknown): void` -- Log at ERROR level

All four methods share the same signature. The `data` parameter is optional; its
presence changes the output format (see Output Format below).

### LOG_LEVEL

Controls the minimum severity threshold. Messages below the threshold are
discarded silently.

| Value   | What is shown            | Use case                               |
| ------- | ------------------------ | -------------------------------------- |
| `debug` | DEBUG, INFO, WARN, ERROR | Full trace during active investigation |
| `info`  | INFO, WARN, ERROR        | Default; general progress and problems |
| `warn`  | WARN, ERROR              | Focus on suspicious conditions         |
| `error` | ERROR only               | Identify failures with minimal noise   |

**Default**: `info` (when `LOG_LEVEL` is not set or is unrecognized).

**Output destinations:**

- DEBUG, INFO, WARN go to **stdout** via `console.log`
- ERROR goes to **stderr** via `console.error`

This separation matters for shell redirection and CI log capture. Errors appear
in the stderr stream, so you can isolate them with `2>error.log`.

### LOG_LENGTH

Controls truncation of the entire formatted output, including the message, data
lines, and timestamp line.

| Value   | Max characters | When to use                                      |
| ------- | -------------- | ------------------------------------------------ |
| (unset) | 80             | CI pipelines, quick scans, high-frequency points |
| `S`     | 160            | General debugging sessions                       |
| `L`     | 300            | API payloads, complex state objects              |
| `W`     | Unlimited      | Full object dumps, deep root-cause analysis      |

When a message exceeds the limit, it is cut and `...` is appended. The three
characters of `...` count toward the limit (so a limit of 80 shows 77 characters
of content plus `...`).

Truncation applies to the entire formatted output. If you log a message with
data, the Data and Timestamp lines are part of the string that gets truncated.
This is why short limits can cut into or hide data entirely -- by design, it
forces you to increase the length only when you need to inspect data.

### LOG_KEY

Filters output to loggers whose key matches one of the specified values. Accepts
one or more keys separated by any of these delimiters: comma (`,`), colon (`:`),
or slash (`/`).

```bash
LOG_KEY=auth deno test --allow-env
LOG_KEY=auth,database deno test --allow-env
LOG_KEY=auth:database deno test --allow-env
LOG_KEY=auth/database deno test --allow-env
```

**When `LOG_KEY` is not set**: all keys are shown (no filtering).

The match is exact. `LOG_KEY=auth` will not match a logger with key
`auth-module`. Plan your key names accordingly.

### FORCE_TEST_MODE

```bash
FORCE_TEST_MODE=true deno run --allow-env your_script.ts
```

Set to `"true"` to bypass the test-context detection. The logger normally
inspects the call stack to confirm it is running inside a test file; this
variable overrides that check.

Use cases:

- Debugging the logger itself outside a `_test.ts` file
- Running in non-standard test environments where stack patterns differ
- Quick verification in a REPL or scratch script

This variable is a development escape hatch. Do not set it in production.

### Output Format

**Without data:**

```
[LEVEL] [key] message
```

Example:

```
[INFO] [auth] User login succeeded
```

**With data:**

```
[LEVEL] [key] message
Data: {
  "field": "value"
}
Timestamp: 2025-01-15T09:30:00.000Z
```

Key details:

- The Timestamp line appears **only** when data is provided. Messages without
  data have no timestamp.
- Data is serialized with `JSON.stringify(data, null, 2)` (pretty-printed with
  2-space indentation).
- If `JSON.stringify` fails (typically due to circular references), the output
  falls back to `[Object: toString()]`.
- The entire formatted string -- header line, Data line, and Timestamp line --
  is subject to `LOG_LENGTH` truncation as a single block.

## 4. Strategic Debugging Workflow

Debugging is most efficient when you move from broad to narrow to deep. This
three-phase approach prevents drowning in output while ensuring you reach the
root cause.

### Phase 1: Overview

**Goal**: Identify which tests fail and where the failures cluster.

```bash
LOG_LEVEL=error deno test --allow-env
```

At this level you see only errors. If a test passes but produces errors, those
errors are your starting point. If you see nothing, widen to `warn`:

```bash
LOG_LEVEL=warn deno test --allow-env
```

Warnings often reveal the conditions that precede a failure.

### Phase 2: Isolation

**Goal**: Focus on the specific component that is failing.

```bash
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=S deno test --allow-env
```

Add `LOG_KEY` to filter to the module under suspicion. Use `LOG_LENGTH=S` to get
more context without overwhelming output. At this point you are reading the flow
of a single component through the test.

### Phase 3: Deep Inspection

**Goal**: See the full data that reveals the root cause.

```bash
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=W deno test --allow-env tests/payment_test.ts
```

Remove truncation (`W`) and target a single test file. Now you see every data
object in its entirety. The root cause is usually visible in the data.

### Decision Guide

| Question                         | Action                                        |
| -------------------------------- | --------------------------------------------- |
| Which level should I start with? | `error` -- always start broad                 |
| Too much output?                 | Add `LOG_KEY` to filter to one component      |
| Message truncated?               | Increase `LOG_LENGTH` (`S` then `L` then `W`) |
| Need more detail?                | Add the `data` parameter to your log calls    |
| Error only in one test file?     | Specify the file path after `deno test`       |

## 5. Writing Rules

### Where to Place Loggers

Place loggers at the boundaries where data transforms or transfers. The spec
identifies these as the most informative debug points:

1. **Immediately after receiving function arguments** -- confirms what the
   function actually received, not what the caller intended to send.
2. **Just before returning values** -- captures the function's final answer
   before it leaves the scope.
3. **Before and after external calls** -- brackets the boundary where your code
   hands off to a dependency (database, API, file system). If the inputs look
   right and the outputs look wrong, the problem is in the dependency.
4. **Inside error handlers** -- captures the error object and surrounding
   context at the moment a failure is caught.

```typescript
async function processOrder(order: Order): Promise<Receipt> {
  const logger = new BreakdownLogger("order");

  // 1. After receiving arguments
  logger.debug("processOrder called", order);

  // 3. Before external call
  logger.debug("Calling paymentGateway.charge", {
    orderId: order.id,
    amount: order.total,
  });
  try {
    const charge = await paymentGateway.charge(order);
    // 3. After external call
    logger.debug("paymentGateway.charge returned", charge);
  } catch (err) {
    // 4. Inside error handler
    logger.error("paymentGateway.charge failed", {
      orderId: order.id,
      error: err,
    });
    throw err;
  }

  const receipt = buildReceipt(order, charge);

  // 2. Before returning
  logger.debug("processOrder returning", receipt);
  return receipt;
}
```

### Message Content

Truncation cuts from the end. Front-load the critical information:

```typescript
// Good -- the failure reason is the first thing you read
logger.debug("Timeout: DB connection exceeded 30s", { host: "db.prod" });

// Less useful when truncated -- the key detail is buried at the end
logger.debug(
  "Attempting to establish a database connection which timed out after 30s",
);
```

Keep messages short and factual. Use the `data` parameter for structured details
that need inspection:

```typescript
// Message carries the "what"; data carries the "details"
logger.debug("Query failed", {
  query: "SELECT * FROM orders WHERE status = ?",
  params: ["pending"],
  error: err.message,
  duration: 4500,
});
```

### Circular References

If the `data` argument contains circular references, `JSON.stringify` will fail
and the output becomes `[Object: toString()]`. This is rarely useful. Avoid
passing objects with circular references as data. If you must log such an
object, extract the relevant fields into a plain object first:

```typescript
// circularObj.parent points back to circularObj -- do not pass directly
logger.debug("Node state", {
  id: circularObj.id,
  name: circularObj.name,
  childCount: circularObj.children.length,
});
```

## 6. Operational Rules

### KEY Naming Strategy

Choose key names that align with how you will filter during debugging. Three
common schemes:

**By feature:**

```typescript
new BreakdownLogger("auth");
new BreakdownLogger("payment");
new BreakdownLogger("notification");
```

Best when debugging is driven by user-facing features.

**By layer:**

```typescript
new BreakdownLogger("controller");
new BreakdownLogger("service");
new BreakdownLogger("repository");
```

Best when debugging data flow through architectural layers.

**By flow:**

```typescript
new BreakdownLogger("order-auth");
new BreakdownLogger("order-stock");
new BreakdownLogger("order-payment");
```

Best for tracing a single business process across multiple subsystems.

**Keep keys unique.** If two unrelated modules both use the key `"util"`,
`LOG_KEY=util` will show both, defeating the purpose of filtering. Within a
project, each key should map to exactly one logical component.

### Team Conventions

- Agree on a naming scheme before development begins. Mixing "by feature" and
  "by layer" in the same project creates confusion.
- Maintain a key registry (a simple list in the project docs) so developers can
  look up existing keys before inventing new ones.
- For large projects, use prefixes to create namespaces: `auth-token`,
  `auth-session`, `payment-gateway`, `payment-receipt`.

### Temporary Investigation

When investigating a specific issue, use a unique tag that will not collide with
permanent keys:

```typescript
const logger = new BreakdownLogger("fix-423");
logger.debug("State before the suspected off-by-one", { index, length });
```

```bash
LOG_LEVEL=debug LOG_KEY=fix-423 deno test --allow-env
```

Remove the temporary logger when the investigation is complete. Leaving
temporary loggers in the codebase creates noise for the next person.

### CI Integration

In continuous integration, log output should be minimal by default and expanded
only when investigating failures:

```bash
# Standard CI run -- errors only, minimal noise
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write

# Investigating a CI failure -- full debug with extended length
LOG_LEVEL=debug LOG_LENGTH=L deno test --allow-env --allow-read --allow-write
```

Since ERROR goes to stderr and other levels go to stdout, CI systems that
separate these streams will naturally highlight failures.

## 7. Execution Patterns

### Single Test File

```bash
LOG_LEVEL=debug deno test --allow-env --allow-read --allow-write tests/auth_test.ts
```

### Full Test Suite with Debug

```bash
LOG_LEVEL=debug deno test --allow-env --allow-read --allow-write
```

### Filtered by Key

```bash
# Single key
LOG_LEVEL=debug LOG_KEY=database deno test --allow-env --allow-read --allow-write

# Multiple keys
LOG_LEVEL=debug LOG_KEY=auth,database,cache deno test --allow-env --allow-read --allow-write
```

### CI Pipeline (Error-Only)

```bash
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write
```

### Progressive Narrowing

This sequence shows the full Broad-to-Narrow-to-Deep workflow as a series of
commands you would run in order:

```bash
# Step 1: What is failing?
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write

# Step 2: What warnings preceded the failure?
LOG_LEVEL=warn deno test --allow-env --allow-read --allow-write

# Step 3: Full trace of the suspected module, truncated for readability
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=S deno test --allow-env --allow-read --allow-write

# Step 4: More detail on the same module
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=L deno test --allow-env --allow-read --allow-write

# Step 5: Full data dumps for the failing test file
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=W deno test --allow-env --allow-read --allow-write tests/payment_test.ts
```

Each step either confirms your hypothesis or tells you to shift focus. You never
start at Step 5 because the volume of output makes it harder to see patterns.

## 8. Output Understanding

### Stream Routing

| Level | Stream | Function        |
| ----- | ------ | --------------- |
| DEBUG | stdout | `console.log`   |
| INFO  | stdout | `console.log`   |
| WARN  | stdout | `console.log`   |
| ERROR | stderr | `console.error` |

This separation is deliberate. In shells and CI systems, stdout and stderr can
be captured independently.

### File Output

BreakdownLogger does not write to files. It is a console debugging tool by
design. If you need to capture output to a file, use shell redirection:

```bash
# Capture everything to one file
deno test --allow-env --allow-read --allow-write 2>&1 | tee debug.log

# Separate stdout and stderr into different files
deno test --allow-env --allow-read --allow-write > stdout.log 2> stderr.log
```

The second form is especially useful: `stderr.log` will contain only ERROR-level
messages, while `stdout.log` will contain DEBUG, INFO, and WARN messages.

### Reading Truncated Output

When you see `...` at the end of a line, the message was truncated. Increase
`LOG_LENGTH` one tier at a time:

1. (unset) 80 chars -- if truncated, try `S`
2. `S` 160 chars -- if still truncated, try `L`
3. `L` 300 chars -- if still truncated, try `W`
4. `W` unlimited -- now you see everything

### Timestamp Format

Timestamps are in ISO 8601 format:

```
2025-01-15T09:30:00.000Z
```

Timestamps appear **only** when the `data` parameter is provided. Messages
without data have no timestamp. This keeps simple trace messages compact while
giving detailed log entries a temporal reference.

## 9. Practical Examples

### Function Call Tracing

Use separate keys for caller and callee to trace data across boundaries:

```typescript
// order_service_test.ts
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

const callerLog = new BreakdownLogger("order-caller");
const serviceLog = new BreakdownLogger("order-service");

Deno.test("order processing traces correctly", async () => {
  const order = { id: "ord-99", amount: 2500, currency: "USD" };

  // Caller side: what are we sending?
  callerLog.debug("Calling processOrder", order);

  const result = await processOrder(order);

  // Caller side: what did we get back?
  callerLog.debug("processOrder returned", result);
});

async function processOrder(order: Order) {
  // Service side: what did we receive?
  serviceLog.debug("processOrder received", order);

  const validated = validate(order);
  serviceLog.debug("Validation result", validated);

  const receipt = await charge(validated);

  // Service side: what are we returning?
  serviceLog.debug("processOrder returning", receipt);
  return receipt;
}
```

```bash
# See only the caller perspective
LOG_LEVEL=debug LOG_KEY=order-caller deno test --allow-env --allow-read --allow-write

# See only the service internals
LOG_LEVEL=debug LOG_KEY=order-service deno test --allow-env --allow-read --allow-write

# See both sides of the boundary
LOG_LEVEL=debug LOG_KEY=order-caller,order-service deno test --allow-env --allow-read --allow-write
```

### Multi-Module Problem Isolation

When a test exercises multiple subsystems, give each its own logger and filter
to the one you need:

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
# Only database activity
LOG_LEVEL=debug LOG_KEY=database deno test --allow-env --allow-read --allow-write integration_test.ts

# Auth and cache together
LOG_LEVEL=debug LOG_KEY=auth,cache deno test --allow-env --allow-read --allow-write integration_test.ts

# Everything, with full data
LOG_LEVEL=debug LOG_LENGTH=W deno test --allow-env --allow-read --allow-write integration_test.ts
```

### Request Tracking with Dynamic Keys

For tests that simulate multiple requests, generate a unique key per request so
you can filter to a single execution path:

```typescript
// api_test.ts
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";

function createRequestLogger(prefix: string): BreakdownLogger {
  const id = crypto.randomUUID().substring(0, 8);
  const key = `${prefix}-${id}`;
  const logger = new BreakdownLogger(key);
  logger.info(`Logger created with key: ${key}`);
  return logger;
}

Deno.test("concurrent request handling", async () => {
  const requests = [
    { method: "GET", path: "/users" },
    { method: "POST", path: "/orders" },
    { method: "PUT", path: "/users/42" },
  ];

  const handlers = requests.map((req) => {
    const logger = createRequestLogger("req");
    logger.debug("Handling request", req);
    return handleRequest(req, logger);
  });

  await Promise.all(handlers);
});
```

When the test runs, each request logs its key at INFO level. Find the key of the
request you want to investigate, then re-run with that key:

```bash
# First run -- see all keys
LOG_LEVEL=info deno test --allow-env --allow-read --allow-write api_test.ts
# Output includes: [INFO] [req-a1b2c3d4] Logger created with key: req-a1b2c3d4

# Second run -- filter to one request
LOG_LEVEL=debug LOG_KEY=req-a1b2c3d4 LOG_LENGTH=W deno test --allow-env --allow-read --allow-write api_test.ts
```

This pattern scales to any scenario where multiple instances of the same logic
run in parallel and you need to trace one specific execution.
