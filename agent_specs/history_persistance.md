# Plan: Persist calculator history to file

## Context

Calculator history is currently in-memory only — it's lost when DMS restarts. The `persistHistoryOnFile` setting (default `false`), when enabled, saves and loads history from a JSON file. The default path is `<pluginDirectory>/calculator_history.json`, derived from `pluginService.pluginDirectory` to ensure a fully resolved absolute path (since `FileView` does not expand `~`).

The approach follows the pattern used by `aiAssistant/AIAssistantService.qml`, which uses `FileView` (from `Quickshell.Io`) with `atomicWrites` to persist JSON data to disk.

## Files modified

1. **`CalculatorLauncher.qml`** — Added FileView, load/save logic, wired into `addToHistory`
2. **`CalculatorSettings.qml`** — Added `persistHistoryOnFile` toggle and `historyFilePath` string setting

## Changes

### 1. `CalculatorLauncher.qml`

**Added import:**
```qml
import Quickshell.Io
```

**Added properties** (after existing `keepLastResults` property):
```qml
property bool persistHistoryOnFile: false
property string historyFilePath: ""
```

The `historyFilePath` defaults to empty; the actual default is computed at runtime from `pluginService.pluginDirectory + "/calculator_history.json"` to get a fully resolved absolute path.

**Load settings in `Component.onCompleted`** (after existing `keepLastResults` load):
```javascript
persistHistoryOnFile = pluginService.loadPluginData("calculator", "persistHistoryOnFile", false);
var defaultHistoryPath = pluginService.pluginDirectory + "/calculator_history.json";
historyFilePath = pluginService.loadPluginData("calculator", "historyFilePath", defaultHistoryPath);
if (persistHistoryOnFile) {
    historyFile.path = historyFilePath;
}
```

**Added `FileView` component** (follows aiAssistant pattern):
```qml
property FileView historyFile: FileView {
    id: historyFile
    path: ""
    blockWrites: true
    atomicWrites: true

    onLoaded: {
        try {
            var data = JSON.parse(text());
            if (Array.isArray(data))
                root.history = data;
        } catch (e) {
            console.log("[Calculator] Failed to parse history file:", e);
        }
    }

    onLoadFailed: {
        console.log("[Calculator] No existing history file, starting fresh");
    }
}
```

Setting `path` triggers loading automatically. `blockWrites: true` means writes only happen when we explicitly call `setText()`. `atomicWrites: true` prevents partial writes.

**Added `saveHistory` function:**
```javascript
function saveHistory() {
    if (persistHistoryOnFile && historyFile.path)
        historyFile.setText(JSON.stringify(history, null, 2));
}
```

**Called `saveHistory()` at the end of `addToHistory`** (after `history = updated;`):
```javascript
saveHistory();
```

This means every time a history entry is added (which only happens in `executeItem` on Enter), the file is written.

### 2. `CalculatorSettings.qml`

**Added after the "History Size" `StringSetting`:**
```qml
ToggleSetting {
    id: persistHistoryToggle
    settingKey: "persistHistoryOnFile"
    label: "Persist History"
    description: persistHistoryToggle.value
        ? "History is saved to file and restored across sessions."
        : "History is in-memory only and cleared on restart."
    defaultValue: false
}

StringSetting {
    visible: persistHistoryToggle.value
    settingKey: "historyFilePath"
    label: "History File Path"
    description: "Path to the JSON file where history is stored. Leave empty for default location."
    placeholder: "Default: <plugins>/calculator_history.json"
    defaultValue: ""
}
```

The file path setting only appears when persist is enabled.

## Important: Path resolution

`FileView` does **not** expand `~` in file paths. The default path must be an absolute path. We derive it from `pluginService.pluginDirectory`, which internally uses `StandardPaths.writableLocation(StandardPaths.ConfigLocation)` and strips the `file://` prefix, producing a fully resolved path like `/home/<user>/.config/DankMaterialShell/plugins/calculator_history.json`.

## Data format

The history file stores the same `history` array that's already in memory:

```json
[
  { "expression": "5*5", "result": "25" },
  { "expression": "2+3", "result": "5" }
]
```

## Verification

1. Default behavior unchanged — `persistHistoryOnFile` is `false`, history is in-memory only
2. Enable "Persist History" in settings, reload plugin
3. Type `=5*5`, press Enter — file created at `<pluginDirectory>/calculator_history.json`
4. Verify file contains `[{"expression":"5*5","result":"25"}]`
5. Restart DMS — type `=` — history shows `5*5 = 25` (persisted)
6. Disable "Persist History" — history reverts to in-memory only (file remains but is no longer read/written)
7. Custom path: change path in settings, verify new file is used
