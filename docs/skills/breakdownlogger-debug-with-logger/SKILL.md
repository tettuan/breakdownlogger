---
name: breakdownlogger-debug-with-logger
description: Use when debugging test failures, investigating behavior, or running tests with BreakdownLogger output. Guides the 3-phase debugging workflow and environment controls. Trigger words - 'debug', 'test failure', 'investigate', 'LOG_LEVEL', 'LOG_KEY'.
allowed-tools: Read, Grep, Glob, Bash
---

# Debug with Logger: Strategic Execution Guide

## Why This Skill Exists

BreakdownLogger has 3 orthogonal control dimensions (level × length × key).
Used randomly, they produce either too much or too little output. Used
systematically, they isolate root causes in minutes. This skill encodes that
system.

## 1. The Three Dimensions

**Why three**: Each dimension answers a different question. Combining them
multiplies precision.

| Dimension | Variable     | Question it answers       | Values                  |
| --------- | ------------ | ------------------------- | ----------------------- |
| Level     | `LOG_LEVEL`  | How severe?               | `debug/info/warn/error` |
| Length    | `LOG_LENGTH` | How much detail?          | (unset)/`S`/`L`/`W`    |
| Key       | `LOG_KEY`    | Which component?          | Comma-separated keys    |

**Why this matters**: `LOG_LEVEL=debug` alone floods output. Add `LOG_KEY` to
focus on one module. Add `LOG_LENGTH=W` to see full data. Each knob independently
narrows the search space.

## 2. The Three-Phase Workflow

**Why phases**: Starting with full debug output hides patterns in noise. Starting
broad reveals where to zoom in.

### Phase 1: Overview — What is failing?

```bash
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write
```

**Why error first**: Errors are signals. If nothing appears, widen to `warn`.
Warnings reveal conditions that precede failures.

### Phase 2: Isolation — Which component?

```bash
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=S deno test --allow-env --allow-read --allow-write
```

**Why add KEY here**: You know the failing area from Phase 1. Now filter to that
component. `LOG_LENGTH=S` (160 chars) gives more context without overwhelming.

### Phase 3: Deep Inspection — What is the root cause?

```bash
LOG_LEVEL=debug LOG_KEY=payment LOG_LENGTH=W deno test --allow-env --allow-read --allow-write tests/payment_test.ts
```

**Why remove truncation last**: Full data dumps are only useful when you already
know where to look. The root cause is usually visible in the data.

## 3. KEY Discovery at Runtime

**Why**: You can't filter by KEY if you don't know what KEYs exist.

### Find all KEYs in the codebase

```bash
grep -rn 'new BreakdownLogger(' --include='*.ts' | grep -oP '"[^"]*"' | sort -u
```

### Find KEYs in a specific area

```bash
grep -rn 'new BreakdownLogger(' tests/ --include='*.ts'
```

### The LOG_KEY filter is exact match

`LOG_KEY=auth` does NOT match `auth-module`. Plan accordingly.

| LOG_KEY value         | What it matches                   |
| --------------------- | --------------------------------- |
| `auth`                | Only loggers with key `"auth"`    |
| `auth,database`       | `"auth"` OR `"database"`          |
| `auth:database`       | Same (colon delimiter also works) |
| (unset)               | All keys — no filtering           |

## 4. Decision Guide

**Why a table**: During debugging, you need fast answers, not prose.

| Symptom                      | Action                                         |
| ---------------------------- | ---------------------------------------------- |
| No output at all             | Check `LOG_LEVEL` is set. Default = `info`     |
| Too much output              | Add `LOG_KEY=<specific-component>`              |
| Message truncated (`...`)    | Increase `LOG_LENGTH`: unset → `S` → `L` → `W` |
| Need to see data objects     | Ensure `data` param is passed in logger call   |
| Errors only in one test      | Append test file path to command                |
| Can't find which KEY to use  | Run grep for `new BreakdownLogger(` in source  |
| Need to trace across modules | Use `LOG_KEY=key1,key2,key3` (multiple keys)   |
| Output from wrong module     | Check for duplicate KEYs across unrelated files |

## 5. Stream Routing

**Why this matters**: stderr and stdout are separate streams. CI systems and
shell redirects treat them differently.

| Level        | Stream | Redirect to capture                    |
| ------------ | ------ | -------------------------------------- |
| DEBUG/INFO/WARN | stdout | `> stdout.log`                       |
| ERROR        | stderr | `2> stderr.log`                        |
| All          | both   | `2>&1 \| tee debug.log`               |

**Why separate**: `stderr.log` contains ONLY errors. Instant failure isolation
without parsing.

## 6. Getting Docs for Debugging Patterns

**Why**: The usage guide contains progressive narrowing examples, function
tracing patterns, and multi-module isolation techniques you don't need to
reinvent.

### Export docs to your project

```bash
deno run -A jsr:@tettuan/breakdownlogger/docs [target-dir]
```

This copies `usage.md` and `usage.ja.md`. The docs contain complete
examples of:

| Pattern               | What it demonstrates                       |
| --------------------- | ------------------------------------------ |
| Function call tracing | Separate keys for caller/callee boundaries |
| Multi-module isolation| Per-module keys with selective filtering    |
| Dynamic keys          | UUID-tagged keys for concurrent request tracing |
| Progressive narrowing | 5-step command sequence from broad to deep |

## 7. Validation During Debugging

**Why validate**: If you added loggers during investigation, verify they don't
leak into production code before committing.

```bash
deno run --allow-read jsr:@tettuan/breakdownlogger/validate [target-dir]
```

### Temporary investigation loggers

**Why tag them**: `fix-423` key signals "I'm temporary, delete me." Unmarked
investigation loggers become permanent noise.

```typescript
// Temporary: clearly marked for removal
const logger = new BreakdownLogger("fix-423");

// After investigation: remove the logger and this import
```

```bash
# Filter to your investigation only
LOG_LEVEL=debug LOG_KEY=fix-423 deno test --allow-env --allow-read --allow-write
```

## Quick Reference: Common Commands

```bash
# Phase 1: errors only
LOG_LEVEL=error deno test --allow-env --allow-read --allow-write

# Phase 2: focused component
LOG_LEVEL=debug LOG_KEY=<key> LOG_LENGTH=S deno test --allow-env --allow-read --allow-write

# Phase 3: full dump, single file
LOG_LEVEL=debug LOG_KEY=<key> LOG_LENGTH=W deno test --allow-env --allow-read --allow-write tests/<file>_test.ts

# Find all KEYs
grep -rn 'new BreakdownLogger(' --include='*.ts' | grep -oP '"[^"]*"' | sort -u

# Validate no production usage
deno run --allow-read jsr:@tettuan/breakdownlogger/validate .
```
