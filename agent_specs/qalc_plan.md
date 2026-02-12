# Qalc Engine Integration Plan

## Goal

Add `qalc` (libqalculate CLI) as an alternative calculation engine alongside the existing JavaScript engine. Users select the engine in settings. The default remains the JS engine so existing behavior is preserved.

---

## Current Architecture (Implemented)

The qalc engine uses a **persistent interactive process** managed by `QalcService.qml` (a `pragma Singleton`). Expressions are sent to qalc's stdin; results are read from stdout via `SplitParser`.

### Key Files

| File | Role |
|------|------|
| `QalcService.qml` | Singleton managing the persistent qalc process |
| `qmldir` | Registers QalcService as a QML singleton |
| `CalculatorLauncher.qml` | Main plugin, routes queries to the appropriate engine |
| `CalculatorSettings.qml` | Settings UI with engine selector and qalc command config |

---

## Key Design Decisions

### Engine Selection Model

A setting `calcEngine` with values `"default"` and `"qalc"` controls which engine evaluates expressions. Stored via `pluginService` like other settings.

### Async Result Handling — Persistent Interactive Process

The JS engine is synchronous: `getItems()` calls `Calculator.evaluate()` and returns immediately. `qalc` is an external process — results arrive asynchronously.

The implementation uses a **persistent interactive process** via `Quickshell.Io.Process` with `SplitParser` on stdout.

**Flow:**

1. User types in launcher → DMS calls `getItems(query)`.
2. `getItemsQalc()` calls `QalcService.calculate(expression)`.
3. `QalcService` debounces (150ms Timer), then writes the expression to qalc's stdin.
4. `getItems()` returns a `"Calculating..."` placeholder immediately.
5. When qalc outputs a result, `SplitParser.onRead` fires:
   - ANSI codes are stripped, result is trimmed.
   - `lastResult` is updated and `resultReady(result)` signal is emitted.
6. `CalculatorLauncher`'s `Connections` handler calls `pluginService.requestLauncherUpdate(pluginId)`.
7. DMS re-calls `getItems()` → returns the actual result.

### Configurable Qalc Command

The full qalc command (binary + arguments) is configurable via settings. This supports:
- Custom binary paths (e.g., NixOS store paths)
- Modified flags

The command is stored as a string and parsed into an array by `QalcService.splitCommand()`, which handles double-quoted arguments (e.g., `"decimal comma off"`).

Default: `qalc -i -t -set "decimal comma off" -c 0`

### Expression Validation

- **Default engine**: Existing `isMathExpression()` validation (only numbers, operators, parentheses).
- **Qalc engine**: No validation — qalc handles arbitrary expressions including unit conversions, hex, currency, etc.

### Settings UI

DMS provides `SelectionSetting` for the engine dropdown and `StringSetting` for the qalc command. The command setting is only visible when the qalc engine is selected.

---

## Critical Implementation Details (Lessons Learned)

### 1. Launcher Refresh: `requestLauncherUpdate` (NOT `itemsChanged`)

**The `itemsChanged` signal does NOT trigger DMS to re-call `getItems()`.** This was the root cause of results not appearing until the user typed an extra character.

The correct DMS API for requesting a launcher refresh is:

```javascript
pluginService.requestLauncherUpdate(pluginId)
```

This is the same pattern used by the [DankGifSearch plugin](https://github.com/AvengeMedia/dms-plugins/blob/master/DankGifSearch/DankGifSearch.qml).

**Guard it properly:**
```qml
function onResultReady(result) {
    if (!root.pluginService || !root.pluginId)
        return;
    if (typeof root.pluginService.requestLauncherUpdate === "function") {
        root.pluginService.requestLauncherUpdate(root.pluginId);
    }
}
```

### 2. `pluginId` Must Have a Default Value

`pluginId` must be hardcoded to `"calculator"` (matching `plugin.json`), not left as `""`. An empty string is falsy in JavaScript, so guards like `!root.pluginId` would prevent `requestLauncherUpdate` from ever being called.

```qml
// WRONG — empty string is falsy, requestLauncherUpdate never fires
property string pluginId: ""

// CORRECT — matches plugin.json id
property string pluginId: "calculator"
```

The DankGifSearch plugin follows this same pattern: `property string pluginId: "dankGifSearch"`.

### 3. Output Buffering: `stdbuf -oL` Required

When qalc's stdout is connected to a pipe (not a terminal), the C runtime uses **full buffering** by default. This means qalc computes the result but the output sits in an internal buffer — it never reaches `SplitParser` until the buffer fills or more stdin arrives.

**Symptoms:**
- `=8*8` → shows "Calculating..." forever
- `=8*8 ` (extra space) → result appears (the new stdin flushes the buffered output)
- `=2 meters to centimeters` → appears to work (many keystrokes provide enough stdin to flush)

**Fix:** Prepend `stdbuf -oL` to the process command to force line-buffered stdout:

```qml
Process {
    command: ["stdbuf", "-oL"].concat(root.splitCommand(root.qalcCommand))
}
```

`stdbuf` is part of GNU coreutils and available on all standard Linux distributions.

### 4. Debounce Prevents Stale Intermediate Results

Without debouncing, every keystroke sends a query to qalc (e.g., typing "8*8" sends "8", "8*", "8*8"). Responses from earlier partial expressions overwrite `lastResult` with wrong values.

**Fix:** A 150ms debounce Timer in `QalcService` delays sending until the user pauses typing. Only the final expression is sent to qalc.

```qml
Timer {
    id: debounceTimer
    interval: 150
    onTriggered: {
        if (root.pendingExpression && qalcProc.running) {
            qalcProc.write(root.pendingExpression + "\n")
        }
    }
}

function calculate(expression) {
    pendingExpression = expression
    debounceTimer.restart()
}
```

Combined with clearing `lastResult` on new queries in `getItemsQalc()`, this shows "Calculating..." during debounce instead of stale results.

### 5. Process Restart on Command Change

When `qalcCommand` changes (e.g., user configures a different path), the process must restart:

```qml
onQalcCommandChanged: {
    if (qalcProc.running) {
        qalcProc.running = false
    }
    qalcProc.running = true
}
```

Note: The existing `onRunningChanged` auto-restart handler will also fire when `running` becomes `false`, effectively performing the restart. The explicit `running = true` in `onQalcCommandChanged` becomes a no-op but is harmless.

---

## File Details

### `QalcService.qml` — Singleton process manager

- `property string qalcCommand` — Full command string (configurable via settings)
- `property string lastResult` — Most recent qalc result
- `property string pendingExpression` — Expression waiting for debounce
- `signal resultReady(string result)` — Emitted when a new result arrives
- `function splitCommand(cmd)` — Quote-aware string → array parser
- `function calculate(expression)` — Debounced expression sender
- `Process` with `stdbuf -oL` wrapping, `SplitParser` on stdout, ANSI stripping
- `Timer` for 150ms debounce
- Auto-restart on process death or command change

### `CalculatorLauncher.qml` — Main plugin component

- `property string pluginId: "calculator"` — **Must be hardcoded** (see above)
- `Connections` to `QalcService.resultReady` → calls `requestLauncherUpdate`
- `getItemsQalc()` clears `lastResult` on new queries, returns cached result or placeholder
- Loads `qalcCommand` from settings in `Component.onCompleted` and pushes to `QalcService`

### `CalculatorSettings.qml` — Settings UI

- `SelectionSetting` for engine (`"default"` / `"qalc"`)
- `StringSetting` for qalc command (visible only when engine is `"qalc"`)
- Conditional operation examples based on selected engine

---

## Resolved Questions

| Question | Resolution |
|----------|-----------|
| `ComboBoxSetting` availability | Use `SelectionSetting` with `options: [{label, value}]` |
| Launcher refresh mechanism | Use `pluginService.requestLauncherUpdate(pluginId)` — NOT `itemsChanged()` |
| `pluginId` default value | Must be hardcoded to `"calculator"`, not `""` |
| Output buffering | Wrap with `stdbuf -oL` to force line-buffered stdout |
| Stale intermediate results | Debounce outgoing queries (150ms Timer) |
| Configurable qalc command | Store full command string, parse with quote-aware `splitCommand()` |
| ANSI codes in output | Strip with regex despite `-c 0` flag (qalc still outputs some codes via pipe) |

## Remaining Considerations

1. **`requestLauncherUpdate` availability**: Guarded with `typeof` check. If unavailable on older DMS versions, results won't auto-refresh (user would need to type an extra character).

2. **`qalc` not in PATH**: Process will fail to start. The `onRunningChanged` handler will log a warning and attempt restart. Could be improved with user-facing error feedback.

3. **`stdbuf` availability**: Part of GNU coreutils, available on all standard Linux distributions. NixOS users may need to adjust the command or ensure coreutils is in PATH. If `stdbuf` is not found, the process won't start — same failure mode as missing `qalc`.

4. **Settings take effect on plugin reload**: Consistent with existing behavior for `trigger` and `calcEngine`. The `qalcCommand` setting is loaded in `Component.onCompleted` and pushed to the singleton. Live updates would require additional plumbing but plugin reload is the established pattern.
