---
name: breakdownlogger-implement-logger
description: Use when implementing features, adding code, or placing BreakdownLogger in source. Guides KEY naming, placement strategy, and validation. Trigger words - 'implement', 'add logger', 'KEY naming', 'validate usage'.
allowed-tools: Read, Grep, Glob, Bash
---

# Implement Logger: Strategic Placement Guide

## Why This Skill Exists

Logger placement is a design decision, not an afterthought. A poorly named KEY
makes debugging impossible later. A logger in the wrong place produces noise
instead of signal. This skill prevents those mistakes upfront.

## 1. KEY Discovery: Find Before You Create

**Why**: Duplicate KEYs destroy filtering. `LOG_KEY=util` showing 5 unrelated
modules defeats the purpose.

**What to do**: Before creating any new logger, search the codebase for existing
KEYs.

```bash
grep -rn 'new BreakdownLogger(' --include='*.ts' | grep -oP '"[^"]*"' | sort -u
```

**Decision table**:

| Situation                        | Action                              |
| -------------------------------- | ----------------------------------- |
| Existing KEY covers your module  | Reuse it                            |
| Existing KEY is too broad        | Create a more specific sub-key      |
| No KEY exists for this area      | Create one following naming rules   |
| Temporary investigation          | Use `fix-<issue>` prefix, delete later |

## 2. KEY Naming Rules

**Why naming matters**: KEY is your filter handle at runtime. You will type it in
`LOG_KEY=...` every time you debug. Bad names cost time repeatedly.

### The Three Schemes (pick ONE per project)

| Scheme     | When                              | Example KEYs                       |
| ---------- | --------------------------------- | ---------------------------------- |
| By feature | User-facing feature debugging     | `auth`, `payment`, `notification`  |
| By layer   | Data flow / architecture issues   | `controller`, `service`, `repository` |
| By flow    | Cross-cutting business processes  | `order-auth`, `order-stock`        |

### Naming Constraints

| Rule                    | Why                                           |
| ----------------------- | --------------------------------------------- |
| Lowercase kebab-case    | Consistent, easy to type in shell             |
| No generic names        | `util`, `helper`, `misc` are unfiltereable    |
| Unique per logical unit | Same KEY in unrelated modules = noise          |
| Prefix for namespacing  | `auth-token`, `auth-session` over `token`, `session` |
| Temp keys: `fix-<id>`   | Signals "delete me when done"                 |

## 3. Where to Place Loggers

**Why placement matters**: Loggers at random spots produce random output. Loggers
at boundaries produce diagnostic answers.

### The Four Boundary Points

1. **After receiving arguments** — confirms what arrived, not what was sent
2. **Before returning values** — captures final answer before scope exit
3. **Before/after external calls** — brackets the dependency boundary
4. **Inside error handlers** — captures context at failure moment

**Why these four**: Data transforms or transfers at boundaries. If input looks
right but output looks wrong, you've isolated the problem to that boundary.

### Anti-patterns

| Bad                                    | Why                                   |
| -------------------------------------- | ------------------------------------- |
| Logger inside tight loops              | Floods output, hides signal           |
| Logger after every line                | Not debugging, just narrating         |
| Logger without `data` param            | Message alone rarely reveals root cause |
| Logger with circular-ref objects       | Falls back to useless `[Object]`      |

## 4. Writing Style

**Why front-loading matters**: `LOG_LENGTH` truncates from the end. Critical info
must come first.

```typescript
// Good: action + result in first 40 chars
logger.debug("Timeout: DB conn exceeded 30s", { host });

// Bad: key detail buried past truncation point
logger.debug("Attempting to establish a database connection which timed out");
```

**Rule**: Message = what happened. Data = the evidence.

```typescript
logger.debug("Query failed", {
  query: sql,
  params: values,
  error: err.message,
  duration: elapsed,
});
```

## 5. Validation: Beyond Tests

**Why**: BreakdownLogger is test-only by design. Production imports are bugs.

### Automated validation

```bash
deno run --allow-read jsr:@tettuan/breakdownlogger/validate [target-dir]
```

**What it does**: Scans for `@tettuan/breakdownlogger` imports in non-test files.
Exit 1 = violations found.

**When to run**:

| Timing          | Why                                         |
| --------------- | ------------------------------------------- |
| Pre-commit hook | Catch production imports before they land   |
| CI pipeline     | Gate merges that introduce violations       |
| Code review     | Reviewer can run to verify PR compliance    |

### Manual grep check

```bash
grep -rn '@tettuan/breakdownlogger' --include='*.ts' | grep -v '_test\.\|\.test\.'
```

Any matches = production usage violation.

## 6. Docs: Getting Examples

**Why**: The usage guide contains battle-tested patterns (function tracing,
multi-module isolation, dynamic keys) that prevent reinventing patterns.

### Export docs to your project

```bash
deno run -A jsr:@tettuan/breakdownlogger/docs [target-dir]
```

Copies `usage.md` and `usage.ja.md` to your target directory. Default:
`tests/docs/breakdownlogger/`.

### Key sections in usage.md

| Section                       | What you'll find                        |
| ----------------------------- | --------------------------------------- |
| §4 Strategic Debugging        | Broad → Narrow → Deep workflow          |
| §5 Writing Rules              | Placement patterns with code            |
| §6 Operational Rules          | KEY naming strategy, team conventions   |
| §9 Practical Examples         | Function tracing, multi-module, dynamic |

### In your project

Read `usage.md` in your docs directory for the full strategic guide. If you
haven't exported the docs yet, run the export command above.

## Checklist (Before You Commit)

```
- [ ] Searched existing KEYs — no duplicates introduced
- [ ] KEY follows project's naming scheme (feature/layer/flow)
- [ ] Loggers placed at boundaries, not randomly
- [ ] Messages front-load critical info
- [ ] Data params used for structured evidence
- [ ] No circular references in data objects
- [ ] validate_cli confirms no production usage
- [ ] Temporary `fix-*` loggers removed if investigation complete
```
