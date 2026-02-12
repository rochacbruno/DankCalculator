# Calculator Plugin for DMS Launcher


[![RELEASE](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Frochacbruno%2FDankCalculator%2Fraw%2Frefs%2Fheads%2Fmain%2Fplugin.json&query=version&style=for-the-badge&label=RELEASE&labelColor=101418&color=9ccbfb)](https://plugins.danklinux.com/calculator.html)

A launcher plugin that evaluates mathematical expressions and copies results to the clipboard.

![Calculator Plugin Screenshot](screenshot.png)

## Features

- **Real-time calculation**: Type mathematical expressions directly in the launcher
- **Default prefix**: Uses `=` as the default trigger prefix (configurable)
- **Safe evaluation**: Only allows mathematical operations, preventing code injection
- **Clipboard integration**: Press Enter to copy the result to clipboard
- **Multiple operations**: Supports +, -, *, /, ^, %, and parentheses
- **Qalc engine support**: Optionally use `qalc` (libqalculate) for unit conversions, hex, currency, and more

## Installation

### Via DMS

```bash
dms plugins install Calculator
```

### Via DMS GUI
- Mod + ,
- Go to Plugins Tab
- Choose Browse
- Enable third party
- install Calculator

### Manually

```
cd ~/.config/DankMaterialShell/plugins
git clone https://github.com/rochacbruno/DankCalculator Calculator
```

1. Open DMS Settings (Ctrl+,)
2. Navigate to Plugins tab
3. Click "Scan for Plugins"
4. Enable the "Calculator" plugin with the toggle switch

## Usage

### With Default Settings (= Prefix)

1. Open the launcher (Ctrl+Space)
2. Type the `=` prefix followed by a mathematical expression: `= 3 + 3`
3. The result (`6`) appears as a launcher item
4. Press Enter to copy the result to clipboard

### Customizing the Trigger

You can configure a different trigger prefix or disable it entirely in the settings:

1. Open Settings → Plugins → Calculator
2. Change the trigger to a custom value (e.g., `calc`, `c`, `math`)
3. Or check "No trigger (always active)" to remove the prefix requirement
4. In the launcher, type your configured trigger: `calc 3 + 3` or just `3 + 3` (if no trigger)
5. Press Enter to copy the result

### Using the Qalc Engine

The plugin supports an alternative calculation engine powered by [qalc](https://qalculate.github.io/) (libqalculate), which adds unit conversions, hex/binary conversions, currency conversion, and many more features.

**To enable it:**

1. Install `qalc` on your system (e.g., `sudo dnf install qalculate` or `sudo apt install qalc`)
2. Open Settings → Plugins → Calculator
3. Change **Calculation Engine** from "Default (JavaScript)" to "Qalc (libqalculate)"

**Qalc examples:**

| Expression | Result |
|------------|--------|
| `= 12cm to inches` | `4.724409449 in` |
| `= 255 to hex` | `0xFF` |
| `= 100 USD to EUR` | (current exchange rate) |
| `= 15% of 200` | `30` |
| `= sqrt(144)` | `12` |
| `= pi * 3^2` | `28.274333882...` |
| `= 5 gallons to liters` | `18.92705892 L` |

### Adding a keybinding (niri)

```kdl
binds {
      Mod+Shift+C hotkey-overlay-title="Calculator" {
        spawn "dms" "ipc" "call" "spotlight" "openQuery" "=";
    }
}
```

## Supported Operations

### Default Engine (JavaScript)

- **Addition**: `= 3 + 3` → `6`
- **Subtraction**: `= 10 - 5` → `5`
- **Multiplication**: `= 4 * 7` → `28`
- **Division**: `= 20 / 4` → `5`
- **Exponentiation**: `= 2 ^ 8` → `256`
- **Modulo**: `= 17 % 5` → `2`
- **Parentheses**: `= (5 + 3) * 2` → `16`
- **Decimals**: `= 3.14 * 2` → `6.28`
- **Complex**: `= (10 + 5) * 2 - 3 / 3` → `29`

### Qalc Engine (libqalculate)

Supports everything the default engine does, plus:

- **Unit conversions**: `= 12cm to inches`, `= 5 gallons to liters`
- **Hex/Binary**: `= 255 to hex`, `= 0xFF to decimal`
- **Percentages**: `= 15% of 200`
- **Currency**: `= 100 USD to EUR`
- **Functions**: `= sqrt(144)`, `= sin(45 deg)`, `= log(1000)`
- **Constants**: `= pi * r^2`, `= c / 2` (speed of light)

See the [qalc manual](https://qalculate.github.io/manual/) for a full list of supported features.

## Examples

| Expression | Result |
|------------|--------|
| `= 3 + 3` | `6` |
| `= 100 / 4` | `25` |
| `= 2 ^ 10` | `1024` |
| `= (5 + 3) * 2` | `16` |
| `= 3.14159 * 2` | `6.28318` |
| `= 16 ^ 0.5` | `4` (square root) |

## Security

The default JavaScript engine uses safe expression evaluation:
- Only allows numbers, operators (+, -, *, /, ^, %), parentheses, and dots
- Rejects any expressions with letters or special characters (except operators)
- Prevents code injection by validating input before evaluation

The qalc engine delegates evaluation to the `qalc` binary, which runs as a sandboxed child process.

## Files

- `plugin.json` - Plugin manifest
- `CalculatorLauncher.qml` - Main launcher component
- `CalculatorSettings.qml` - Settings UI
- `calculator.js` - Safe expression evaluation logic (default engine)
- `QalcService.qml` - Qalc process manager singleton (qalc engine)
- `qmldir` - QML module directory
- `README.md` - This file

## Configuration

Settings are stored in `~/.config/DankMaterialShell/plugin_settings.json` under the `calculator` plugin key:

```json
{
  "pluginSettings": {
    "calculator": {
      "trigger": "=",
      "noTrigger": false,
      "calcEngine": "default"
    }
  }
}
```

Set `"calcEngine"` to `"qalc"` to use the qalc engine, or `"default"` for the built-in JavaScript engine.

## Troubleshooting

**Calculator items don't appear:**
- Make sure the plugin is enabled in Settings → Plugins
- Check that you're typing a valid mathematical expression
- Try disabling "No trigger" and setting a specific trigger

**Result shows wrong value:**
- JavaScript has floating-point precision limitations
- Very large or very small numbers may use scientific notation
- Try switching to the qalc engine for better precision

**Qalc engine shows "Calculating..." but no result:**
- Make sure `qalc` is installed and available in your PATH
- Test by running `qalc -t "2+2"` in a terminal

**Copy to clipboard doesn't work:**
- Make sure your system clipboard is accessible
- Check console for error messages

## Version

0.2.0

## Author

Bruno Cesar Rocha

## License

Same as DankMaterialShell
