# Plan: In-memory calculation history

## Context

Users want to see their recent calculations when they activate the calculator plugin with just the trigger (e.g., `=`). This lets them quickly copy a previous result without recalculating. History is in-memory only — it doesn't need to persist across DMS sessions.

## Behavior

- `=` (trigger only, empty expression) → show last N results as launcher items, newest first
- `=8*8` (trigger + expression) → show current result only (existing behavior)
- Selecting a history item copies its result to clipboard (same as current results)
- Both engines (default + qalc) add to history
- Default N = 10, configurable via `keepLastResults` setting

## Files to modify

### 1. `CalculatorLauncher.qml`

**New properties:**
```qml
property var history: []
property int keepLastResults: 10
```

**Load setting in `Component.onCompleted`:**
```javascript
keepLastResults = parseInt(pluginService.loadPluginData("calculator", "keepLastResults", "10")) || 10;
```

**New function — `addToHistory(expression, result)`:**
```javascript
function addToHistory(expression, result) {
    // Avoid duplicate if same expression+result is already the most recent
    if (history.length > 0 && history[0].expression === expression && history[0].result === result)
        return;
    // Remove any existing entry for this expression (re-selecting moves it to top)
    var filtered = history.filter(function(entry) {
        return entry.expression !== expression;
    });
    var updated = [{expression: expression, result: result}].concat(filtered);
    if (updated.length > keepLastResults)
        updated = updated.slice(0, keepLastResults);
    history = updated;
}
```

**Modify `getItems(query)`:**
Currently returns `[]` for empty queries. Change to return history items:
```javascript
function getItems(query) {
    if (!query || query.trim().length === 0)
        return getHistoryItems();
    // ... rest unchanged
}
```

**New function — `getHistoryItems()`:**
```javascript
function getHistoryItems() {
    if (history.length === 0)
        return [];
    return history.map(function(entry) {
        return {
            name: entry.result,
            icon: "material:history",
            comment: entry.expression + " = " + entry.result,
            action: "copy:" + entry.result,
            categories: ["Calculator"]
        };
    });
}
```

**Add to history from `executeItem()` (the "copy" case):**
History is recorded only when the user presses Enter, not on every keystroke. The expression is extracted from the item's `comment` field (format: `expression + " = " + result`). The "Calculating..." placeholder has no ` = ` in its comment, so it won't match. Re-selecting a history item moves it to the top.
```javascript
case "copy":
    copyToClipboard(actionData);
    if (item.comment) {
        var eqIdx = item.comment.indexOf(" = ");
        if (eqIdx !== -1)
            addToHistory(item.comment.substring(0, eqIdx), actionData);
    }
    break;
```

### 2. `CalculatorSettings.qml`

Add a `StringSetting` for `keepLastResults` (no `NumberSetting` exists in DMS). Place it after the trigger settings section, before the "Supported Operations" section:

```qml
StringSetting {
    settingKey: "keepLastResults"
    label: "History Size"
    description: "Number of recent results to show when calculator is triggered with no expression"
    placeholder: "10"
    defaultValue: "10"
}
```

## Verification

1. Type `=` with no prior calculations → empty list (no history yet)
2. Type `=8*8` → shows "64", press Enter to copy → added to history
3. Type `=2+3` → shows "5", press Enter to copy → added to history
4. Type `=` → shows "5" then "64" (newest first)
5. Select a history item → copies result to clipboard and moves it to top
6. Type `=5*5` keystroke-by-keystroke → history does NOT contain intermediate entries (`5`, `5*`)
7. Qalc engine: calculate `=2m to cm`, press Enter → result added to history
8. Change `keepLastResults` to 2, reload, verify only 2 items shown
9. History clears on DMS restart (in-memory only)
