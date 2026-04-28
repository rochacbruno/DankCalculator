# Math Functions Support Plan

## Goal

Add mathematical function support (trig, logarithmic, roots, rounding, etc.) and constants to the default JavaScript engine, while preserving the existing BigInt and floating-point precision handling.

---

## Current Architecture (Before This Change)

The default JS engine in `calculator.js` uses a three-layer evaluation strategy:

1. **BigInt path** - for integer-only expressions without division (arbitrary precision for large integers)
2. **Precise decimal path** - `toPrecision(15)` to eliminate floating-point errors (e.g., `0.1 + 0.2 = 0.3`)
3. **Fallback** - standard `eval()` for remaining cases

Input validation uses a strict character whitelist: `/^[0-9+\-*/().\s%^]+$/`. This rejects any expression containing letters, which means math functions like `sin()` or constants like `pi` are not supported.

---

## Design Decision: Preprocessing Layer

Rather than replacing the engine or relaxing the character whitelist, a **preprocessing layer** was added that:

1. Detects expressions containing math function names or constants
2. Validates them against a strict whitelist of allowed names
3. Translates recognized names to their `Math.*` equivalents
4. Passes the translated expression to the existing `evaluatePrecise()` path

This preserves full backward compatibility - pure arithmetic expressions continue through the unchanged BigInt/precision pipeline.

### Why a Preprocessing Layer Instead of a New Engine?

A full engine replacement would lose the existing precision advantages:
- BigInt support for large integer precision
- `toPrecision(15)` correction for floating-point errors (0.1 + 0.2 problem)
- Three-layer evaluation strategy

Adding function support as a preprocessing step keeps all of these intact.

---

## Implementation Details

### Supported Functions

| Category | Functions |
|----------|-----------|
| Trigonometric (radians) | sin, cos, tan, asin, acos, atan, atan2 |
| Trigonometric (degrees) | sind, cosd, tand |
| Hyperbolic | sinh, cosh, tanh, asinh, acosh, atanh |
| Logarithmic | log (base 10), ln (natural) |
| Exponential | exp, pow |
| Roots | sqrt, cbrt |
| Rounding | floor, ceil, round, trunc |
| Other | abs, min, max |

### Constants

| Name | Value |
|------|-------|
| pi | Math.PI (3.14159...) |
| e | Math.E (2.71828...) |

### Key Functions Added to calculator.js

| Function | Purpose |
|----------|---------|
| `containsMathFunctions(expr)` | Detects if expression contains any whitelisted names |
| `validateMathExpression(expr)` | Strips known names, verifies remaining chars are safe |
| `preprocessExpression(expr)` | Translates function names to Math.* equivalents |
| `_replaceDegreeFunc(expr, name, mathFunc)` | Handles degree trig with parenthesis matching |
| `_findMatchingParen(expr, pos)` | Finds matching closing parenthesis for degree wrapping |

### Preprocessing Order (Critical)

Function name replacement must follow a specific order to avoid partial matches:

1. **Degree functions first** (`sind`, `cosd`, `tand`) - these need parenthesis-matching to wrap the argument with `*Math.PI/180`
2. **Longer names before shorter** (`asinh` before `sinh` before `sin`) - prevents `sin` from matching inside `sinh`
3. **Negative lookbehind for `.`** - prevents re-matching already-replaced `Math.sin` when processing `sin`
4. **Constants last** (`pi`, `e`) - `pi` uses lookbehind to avoid matching inside `Math.PI`

### The `e` Constant Ambiguity

The letter `e` appears in scientific notation (`1e5`, `2.5e-3`). The replacement uses:
```javascript
/(?<![0-9.])(\be\b)(?![0-9])/gi
```
This ensures `e` is only replaced when not adjacent to digits - `e ^ 2` becomes `Math.E ^ 2`, but `1e5` stays as `1e5`.

### Degree Function Handling

Degree functions (`sind`, `cosd`, `tand`) require wrapping the argument with a radian conversion. Simple regex replacement like `sind(` -> `Math.sin(Math.PI/180*(` would mismatch parentheses for nested expressions.

Instead, `_replaceDegreeFunc` uses `_findMatchingParen` to find the matching closing parenthesis, extracts the inner expression, and produces:
```
sind(45 + 5) -> Math.sin((45 + 5)*Math.PI/180)
```

### Security Model

The security approach mirrors the existing engine - strict whitelist validation:

1. `containsMathFunctions()` detects if alphabetic content is present
2. `validateMathExpression()` strips all recognized function/constant names
3. After stripping, remaining characters must match `/^[0-9+\-*/().\s%^,]*$/`
4. Commas are additionally allowed (for `min(a, b)`, `pow(x, y)`, etc.)
5. Any unrecognized alphabetic content causes rejection

This prevents code injection - `alert(1)`, `console.log(1)`, `require("fs")` are all rejected because `alert`, `console`, `require` are not in the whitelist.

### Evaluation Path

```
Expression with functions:
  input -> containsMathFunctions() -> validateMathExpression() -> preprocessExpression() -> evaluatePrecise() -> result

Pure arithmetic (unchanged):
  input -> allowedChars regex -> BigInt path (if integer-only) -> evaluatePrecise() -> result
```

---

## Modified Files

| File | Change |
|------|--------|
| `calculator.js` | Added preprocessing layer, whitelist, and function translation |
| `CalculatorSettings.qml` | Added function/constant/degree examples to supported operations list |

## API Compatibility

The public API is unchanged:
- `evaluate(expression)` - returns `{success: boolean, result: number|string|null, error: string|null}`
- `isMathExpression(query)` - returns `boolean`

Both functions now accept expressions with math function names in addition to pure arithmetic.

---

## Test Results

40/40 tests pass covering:
- All math functions (sin, cos, sqrt, log, ln, pow, etc.)
- Constants (pi, e)
- Degree trig (sind, cosd, tand)
- Composite expressions (2 + sqrt(9), sqrt(pow(3,2) + pow(4,2)))
- Hyperbolic and inverse trig functions
- Security rejection (alert, console.log, require)
- Backward compatibility (0.1 + 0.2 = 0.3, BigInt for large integers, all operators)
