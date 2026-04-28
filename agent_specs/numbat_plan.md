# Numbat Engine Integration - ADR

## Context

The calculator plugin already supports two engines: the built-in JavaScript engine (synchronous, basic arithmetic) and qalc (persistent interactive process via stdin/stdout). A third engine, [numbat](https://numbat.dev), was requested. Numbat is a statically typed language for scientific computations with first-class support for physical dimensions and units.

Numbat supports two modes:
- **Interactive REPL**: `numbat` (no arguments) - maintains state across commands, supports `ans`/`_` for previous results.
- **One-shot evaluation**: `numbat -e '<expression>'` - evaluates a single expression and exits.

---

## Decision

Use a **persistent interactive process** (same approach as QalcService), not the one-shot `-e` mode.

### Why not one-shot `-e`?

The initial implementation used one-shot `-e` mode (spawning a new `numbat -e '<expr>'` process per evaluation). This failed because Quickshell's `Process` component does not reliably restart after the child process exits - the first evaluation worked, but subsequent ones produced no results.

### Why persistent interactive?

Testing confirmed that numbat's interactive mode works correctly with piped stdin:
- Expressions written to stdin produce clean results on stdout (one line per result)
- No ANSI codes in piped mode (unlike qalc which still emits some codes)
- `stdbuf -oL` ensures line-buffered output

### Numbat-specific behavior: exit on error

Unlike qalc (which prints an error and continues), **numbat exits when it encounters an invalid expression** in piped mode. This means:
- Invalid expressions kill the process
- The auto-restart logic (exponential backoff, 3-retry limit) handles this transparently
- The process restarts and is ready for the next valid expression

---

## Architecture

### Comparison with QalcService

| Aspect | QalcService | NumbatService |
|--------|-------------|---------------|
| Process lifecycle | Persistent interactive | Persistent interactive |
| Input method | Writes expression to stdin | Writes expression to stdin |
| `stdinEnabled` | `true` | `true` |
| `stdbuf` wrapper | Required (line buffering fix) | Used for safety |
| ANSI stripping | Required (`-c 0` still emits codes) | Not needed (clean output when piped) |
| Error handling | Process continues after errors | Process exits on errors (auto-restart) |
| Command | Full command with flags | Binary name/path only |

### Flow

1. User types in launcher - DMS calls `getItems(query)`.
2. `getItemsNumbat()` calls `NumbatService.calculate(expression)`.
3. `NumbatService` debounces (150ms Timer), then writes the expression to numbat's stdin.
4. `getItems()` returns a `"Calculating..."` placeholder immediately.
5. Numbat evaluates and writes result to stdout.
6. `SplitParser.onRead` fires - `lastResult` is updated, `resultReady` signal emitted.
7. `CalculatorLauncher`'s `Connections` handler calls `pluginService.requestLauncherUpdate(pluginId)`.
8. DMS re-calls `getItems()` - returns the actual result.

### Error / Restart Flow

1. User types an invalid expression (e.g., `foo_bar`).
2. Numbat writes error to stderr and exits.
3. `onRunningChanged` fires (`running = false`), `_failCount` increments.
4. Retry timer fires after `_failCount * 1000ms` delay.
5. Process restarts, ready for the next expression.
6. If numbat is not installed, 3 consecutive failures trigger `failed = true`.

---

## Files Changed

| File | Change |
|------|--------|
| `NumbatService.qml` | **New** - Singleton managing persistent numbat process |
| `qmldir` | Added `singleton NumbatService NumbatService.qml` |
| `CalculatorLauncher.qml` | Added `numbatConn` Connections, `getItemsNumbat()`, numbat settings loading, active state management in `onCalcEngineChanged` |
| `CalculatorSettings.qml` | Added "Numbat" to engine dropdown, numbat command setting, numbat-specific operation examples |

### NumbatService.qml

- `property string numbatCommand` - Binary name or path (default: `"numbat"`)
- `property string lastResult` - Most recent numbat result
- `property string pendingExpression` - Expression waiting for debounce
- `signal resultReady(string result)` - Emitted when a new result arrives
- `function splitCommand(cmd)` - Quote-aware string to array parser (shared pattern with QalcService)
- `function calculate(expression)` - Debounced expression sender
- `Process` with `stdbuf -oL` wrapping, `SplitParser` on stdout
- `Timer` for 150ms debounce
- Auto-restart on process death with exponential backoff (1s, 2s, 3s), 3-retry limit

### Settings

The `numbatCommand` setting stores the binary name/path (default: `"numbat"`). Unlike the qalc setting (which stores the full command with all flags), the numbat setting is simpler since numbat needs no special interactive-mode flags.

Users can customize the command for:
- Custom binary paths (e.g., `~/.cargo/bin/numbat`, Nix store paths)
- Additional flags (e.g., `numbat --no-config`)

---

## Numbat Output Format

Verified by testing with the installed binary:

```
$ echo -e "5*5\n12 cm -> inches\nsqrt(144)" | stdbuf -oL numbat
25
4.72441 in
12
```

Output is one clean line per expression with no ANSI codes, no `= ` prefix, no prompt characters. Error output goes to stderr only (not captured by SplitParser), and causes the process to exit.
