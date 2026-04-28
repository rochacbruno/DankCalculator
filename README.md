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
- **Math functions**: sin, cos, tan, sqrt, log, ln, pow, abs, floor, ceil, round, and more
- **Constants**: pi and e
- **Degree trig**: sind, cosd, tand for degree-based trigonometry
- **Qalc engine support**: Optionally use `qalc` (libqalculate) for unit conversions, hex, currency, and more
- **Numbat engine support**: Optionally use [numbat](https://numbat.dev) for scientific computations with physical dimensions and units
- **Calculation history**: Recent results are shown when the trigger is typed with no expression, newest first (in-memory, configurable size)
- **Persistent history**: Optionally save history to a JSON file so it survives DMS restarts

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

### Using the Numbat Engine

The plugin also supports [numbat](https://numbat.dev), a statically typed language for scientific computations with first-class support for physical dimensions and units.

**To enable it:**

1. Install `numbat` on your system (e.g., `cargo install numbat` or via your package manager)
2. Open Settings -> Plugins -> Calculator
3. Change **Calculation Engine** from "Default (JavaScript)" to "Numbat"

**Numbat examples:**

| Expression | Result |
|------------|--------|
| `= 5 * 5` | `25` |
| `= 12 cm -> inches` | `4.72441 in` |
| `= 30 km/h -> mi/h` | `18.6411 mi/h` |
| `= sqrt(144)` | `12` |
| `= pi * 3^2` | `28.2743...` |
| `= 1.2e3 J -> kWh` | `3.33333e-4 kWh` |

See the [numbat documentation](https://numbat.dev/docs/) for the full list of supported features.

### Viewing History

After calculating expressions, you can recall recent results:

1. Open the launcher and type just the trigger (e.g., `=`)
2. Your recent calculations appear as a list, newest first
3. Select any history item to copy its result to clipboard

History is stored in-memory by default and clears when DMS restarts. The number of entries kept is configurable via the **History Size** setting (default: 10).

### Persisting History

To keep history across DMS restarts:

1. Open Settings -> Plugins -> Calculator
2. Enable **Persist History**
3. Optionally set a custom **History File Path** (defaults to `<plugins>/calculator_history.json`)

When enabled, history is saved to a JSON file every time a result is copied, and loaded back on startup.

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

**Arithmetic:**

- **Addition**: `= 3 + 3` → `6`
- **Subtraction**: `= 10 - 5` → `5`
- **Multiplication**: `= 4 * 7` → `28`
- **Division**: `= 20 / 4` → `5`
- **Exponentiation**: `= 2 ^ 8` → `256`
- **Modulo**: `= 17 % 5` → `2`
- **Parentheses**: `= (5 + 3) * 2` → `16`
- **Decimals**: `= 3.14 * 2` → `6.28`
- **Complex**: `= (10 + 5) * 2 - 3 / 3` → `29`

**Math functions:**

- **Trigonometric (radians)**: `= sin(pi/2)` → `1`, `= cos(0)` → `1`, `= tan(pi/4)` → `1`
- **Trigonometric (degrees)**: `= sind(90)` → `1`, `= cosd(60)` → `0.5`, `= tand(45)` → `1`
- **Inverse trig**: `= asin(1)` → `1.5707...`, `= acos(0)` → `1.5707...`, `= atan(1)` → `0.7853...`
- **Hyperbolic**: `= sinh(1)`, `= cosh(1)`, `= tanh(0.5)` and inverse variants (asinh, acosh, atanh)
- **Logarithmic**: `= log(100)` → `2` (base 10), `= ln(e)` → `1` (natural)
- **Roots**: `= sqrt(144)` → `12`, `= cbrt(27)` → `3`
- **Rounding**: `= floor(3.7)` → `3`, `= ceil(3.2)` → `4`, `= round(3.5)` → `4`, `= trunc(3.9)` → `3`
- **Other**: `= abs(-5)` → `5`, `= min(3, 7)` → `3`, `= max(3, 7)` → `7`, `= pow(2, 10)` → `1024`
- **Constants**: `= pi * 2` → `6.2831...`, `= e ^ 2` → `7.389...`
- **Combined**: `= sqrt(pow(3, 2) + pow(4, 2))` → `5`

### Qalc Engine (libqalculate)

Supports everything the default engine does, plus:

- **Unit conversions**: `= 12cm to inches`, `= 5 gallons to liters`
- **Hex/Binary**: `= 255 to hex`, `= 0xFF to decimal`
- **Percentages**: `= 15% of 200`
- **Currency**: `= 100 USD to EUR`
- **Functions**: `= sqrt(144)`, `= sin(45 deg)`, `= log(1000)`
- **Constants**: `= pi * r^2`, `= c / 2` (speed of light)

See the [qalc manual](https://qalculate.github.io/manual/) for a full list of supported features.

### Numbat Engine

Supports everything the default engine does, plus:

- **Unit conversions**: `= 12 cm -> inches`, `= 5 gallon -> liter`
- **Speed/compound units**: `= 30 km/h -> mi/h`
- **Functions**: `= sqrt(144)`, `= sin(45 deg)`, `= log(1000)`
- **Constants**: `= pi * 3^2`, `= speed_of_light`
- **Date/time**: `= now() -> unixtime`
- **Scientific notation**: `= 1.2e3 J -> kWh`

See the [numbat documentation](https://numbat.dev/docs/) for a full list of supported features.

## Examples

| Expression | Result |
|------------|--------|
| `= 3 + 3` | `6` |
| `= 100 / 4` | `25` |
| `= 2 ^ 10` | `1024` |
| `= (5 + 3) * 2` | `16` |
| `= 3.14159 * 2` | `6.28318` |
| `= 16 ^ 0.5` | `4` (square root) |
| `= sin(pi/2)` | `1` |
| `= sqrt(144)` | `12` |
| `= log(100)` | `2` |
| `= sind(30)` | `0.5` |
| `= pi * 2` | `6.28318...` |

## Security

The default JavaScript engine uses safe expression evaluation:
- Only allows numbers, operators (+, -, *, /, ^, %), parentheses, dots, and whitelisted math function names
- Math function names (sin, cos, sqrt, etc.) are validated against a strict whitelist before evaluation
- Rejects any expressions with unrecognized letters or special characters
- Prevents code injection by validating input before evaluation

The qalc engine delegates evaluation to the `qalc` binary, which runs as a sandboxed child process.

The numbat engine delegates evaluation to the `numbat` binary, which runs as a persistent interactive process.

## Files

- `plugin.json` - Plugin manifest
- `CalculatorLauncher.qml` - Main launcher component
- `CalculatorSettings.qml` - Settings UI
- `calculator.js` - Safe expression evaluation logic (default engine)
- `QalcService.qml` - Qalc process manager singleton (qalc engine)
- `NumbatService.qml` - Numbat process manager singleton (numbat engine)
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
      "calcEngine": "default",
      "keepLastResults": "10",
      "persistHistoryOnFile": false,
      "historyFilePath": ""
    }
  }
}
```

Set `"calcEngine"` to `"qalc"` for the qalc engine, `"numbat"` for the numbat engine, or `"default"` for the built-in JavaScript engine.

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

**Numbat engine shows "Calculating..." but no result:**
- Make sure `numbat` is installed and available in your PATH
- Test by running `numbat -e '2+2'` in a terminal
- Check the Numbat Command setting if using a custom binary path

**Copy to clipboard doesn't work:**
- Make sure your system clipboard is accessible
- Check console for error messages

## Author

Bruno Cesar Rocha

## License

Same as DankMaterialShell
