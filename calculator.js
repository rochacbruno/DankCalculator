// Calculator utility for safe mathematical expression evaluation
.pragma library

var MATH_FUNCTION_NAMES = [
    'asinh', 'acosh', 'atanh',
    'sinh', 'cosh', 'tanh',
    'asin', 'acos', 'atan2', 'atan',
    'sind', 'cosd', 'tand',
    'sin', 'cos', 'tan',
    'sqrt', 'cbrt',
    'floor', 'ceil', 'round', 'trunc',
    'log', 'ln', 'exp', 'pow',
    'min', 'max', 'abs'
];

var MATH_CONSTANTS = ['pi', 'e'];

var _mathNamesPattern = null;

function _getMathNamesRegex() {
    if (!_mathNamesPattern) {
        var allNames = MATH_FUNCTION_NAMES.concat(MATH_CONSTANTS);
        _mathNamesPattern = new RegExp('\\b(' + allNames.join('|') + ')\\b', 'i');
    }
    return _mathNamesPattern;
}

function containsMathFunctions(expression) {
    return _getMathNamesRegex().test(expression);
}

function _findMatchingParen(expr, openPos) {
    var depth = 1;
    var pos = openPos + 1;
    while (pos < expr.length && depth > 0) {
        if (expr[pos] === '(') depth++;
        if (expr[pos] === ')') depth--;
        pos++;
    }
    return depth === 0 ? pos - 1 : -1;
}

function _replaceDegreeFunc(expr, funcName, mathFunc) {
    var pattern = new RegExp('\\b' + funcName + '\\s*\\(', 'gi');
    var match;
    var result = expr;
    var offset = 0;

    while ((match = pattern.exec(expr)) !== null) {
        var nameStart = match.index + offset;
        var openParen = nameStart + match[0].length - 1;
        var resultStr = result;
        var closeParen = _findMatchingParen(resultStr, openParen);
        if (closeParen === -1) continue;

        var innerExpr = resultStr.substring(openParen + 1, closeParen);
        var replacement = mathFunc + '((' + innerExpr + ')*Math.PI/180)';
        result = resultStr.substring(0, nameStart) + replacement + resultStr.substring(closeParen + 1);
        offset += result.length - expr.length - offset;
    }
    return result;
}

function preprocessExpression(expression) {
    var processed = expression;

    processed = _replaceDegreeFunc(processed, 'sind', 'Math.sin');
    processed = _replaceDegreeFunc(processed, 'cosd', 'Math.cos');
    processed = _replaceDegreeFunc(processed, 'tand', 'Math.tan');

    var functionMap = [
        ['asinh', 'Math.asinh'], ['acosh', 'Math.acosh'], ['atanh', 'Math.atanh'],
        ['sinh', 'Math.sinh'], ['cosh', 'Math.cosh'], ['tanh', 'Math.tanh'],
        ['asin', 'Math.asin'], ['acos', 'Math.acos'], ['atan2', 'Math.atan2'], ['atan', 'Math.atan'],
        ['sin', 'Math.sin'], ['cos', 'Math.cos'], ['tan', 'Math.tan'],
        ['sqrt', 'Math.sqrt'], ['cbrt', 'Math.cbrt'],
        ['floor', 'Math.floor'], ['ceil', 'Math.ceil'], ['round', 'Math.round'], ['trunc', 'Math.trunc'],
        ['log', 'Math.log10'], ['ln', 'Math.log'],
        ['exp', 'Math.exp'], ['pow', 'Math.pow'],
        ['min', 'Math.min'], ['max', 'Math.max'], ['abs', 'Math.abs']
    ];

    for (var i = 0; i < functionMap.length; i++) {
        var name = functionMap[i][0];
        var replacement = functionMap[i][1];
        // Match function name with optional preceding char; skip if preceded by '.' (already replaced)
        processed = processed.replace(new RegExp('(^|[^.])(\\b' + name + '\\s*\\()', 'gi'), function(m, prefix, fn) {
            return prefix + replacement + '(';
        });
    }

    // Replace 'pi' only when not preceded by '.' (avoid re-replacing Math.PI)
    processed = processed.replace(/(^|[^.])(\bpi\b)/gi, function(m, prefix) {
        return prefix + 'Math.PI';
    });
    // Replace standalone 'e' not adjacent to digits (avoid matching 1e5)
    processed = processed.replace(/(^|[^0-9.])(\be\b)(?![0-9])/gi, function(m, prefix) {
        return prefix + 'Math.E';
    });

    return processed;
}

function validateMathExpression(expression) {
    var stripped = expression.toLowerCase();
    var allNames = MATH_FUNCTION_NAMES.concat(MATH_CONSTANTS);
    for (var i = 0; i < allNames.length; i++) {
        stripped = stripped.replace(new RegExp('\\b' + allNames[i] + '\\b', 'g'), '');
    }
    // After removing function names, only numbers, operators, parens, dots, spaces, commas should remain
    if (!/^[0-9+\-*/().\s%^,]*$/.test(stripped.trim())) {
        return false;
    }
    // Must have at least one digit or known constant
    return /\d/.test(expression) || /\b(pi|e)\b/i.test(expression);
}

function isIntegerOnly(expression) {
    return !/\./.test(expression);
}

/**
 * Evaluates integer expression using BigInt for precision
 */
function evaluateInteger(expression) {
    try {
        // Replace operators with BigInt-safe versions
        let expr = expression.replace(/\s/g, '');

        // Handle exponentiation separately (BigInt doesn't support **)
        if (expr.includes('^')) {
            return evaluateWithExponentiation(expr, true);
        }

        // For modulo, division, and basic arithmetic, try BigInt
        // Note: BigInt division truncates, so we need to handle / carefully
        if (expr.includes('/')) {
            // If division exists, fall back to regular number for accuracy
            return null;
        }

        // Replace numbers with BigInt literals
        expr = expr.replace(/(\d+)/g, '$1n');

        // Evaluate
        const result = eval(expr);

        // Convert back to string then number for display
        // Check if result fits in safe integer range
        const numResult = Number(result);
        if (Number.isSafeInteger(numResult)) {
            return numResult;
        }

        // Return as string for very large integers
        return result.toString().replace(/n$/, '');
    } catch (e) {
        return null;
    }
}

/**
 * Handles exponentiation for both BigInt and regular numbers
 */
function evaluateWithExponentiation(expression, useBigInt) {
    // Find exponentiation operations and evaluate them
    let expr = expression;

    // Handle ^ operator by converting to **
    expr = expr.replace(/\^/g, '**');

    if (useBigInt) {
        // For BigInt, we need custom exponentiation
        // This is complex, so fall back to regular evaluation
        return null;
    }

    const result = eval(expr);
    return result;
}

/**
 * Performs precise decimal arithmetic by working with scaled integers
 */
function evaluatePrecise(expression) {
    try {
        // Replace ^ with ** for exponentiation
        let cleaned = expression.replace(/\^/g, '**');

        // Evaluate using JavaScript's eval (safe because we validated the input)
        let result = eval(cleaned);

        // Check if result is a valid number
        if (typeof result !== 'number' || !isFinite(result)) {
            return null;
        }

        // Handle floating point precision issues
        // Round to 15 significant digits (JavaScript's max precision)
        if (Math.abs(result) < 1e-10 && result !== 0) {
            // Very small number, keep in scientific notation
            return result;
        }

        // For regular decimals, use toPrecision to avoid floating point errors
        // But only if the number has decimal places
        if (result % 1 !== 0) {
            // Count significant digits in result
            const resultStr = result.toString();
            if (resultStr.includes('e')) {
                // Already in scientific notation
                return result;
            }

            // Round to 15 significant figures to eliminate floating point errors
            // e.g., 0.1 + 0.2 = 0.30000000000000004 becomes 0.3
            const precision = 15;
            const rounded = parseFloat(result.toPrecision(precision));

            // If rounding made it a whole number, return as integer
            if (rounded % 1 === 0 && Math.abs(rounded) < Number.MAX_SAFE_INTEGER) {
                return Math.round(rounded);
            }

            return rounded;
        }

        return result;
    } catch (e) {
        return null;
    }
}

/**
 * Safely evaluates a mathematical expression
 * @param {string} expression - The mathematical expression to evaluate
 * @returns {object} - {success: boolean, result: number|string|null, error: string|null}
 */
function evaluate(expression) {
    if (!expression || typeof expression !== 'string') {
        return {
            success: false,
            result: null,
            error: "Invalid expression"
        };
    }

    let cleaned = expression.trim();

    if (cleaned.length === 0) {
        return {
            success: false,
            result: null,
            error: "Empty expression"
        };
    }

    var hasFunctions = containsMathFunctions(cleaned);

    if (hasFunctions) {
        if (!validateMathExpression(cleaned)) {
            return {
                success: false,
                result: null,
                error: "Invalid characters in expression"
            };
        }
        cleaned = preprocessExpression(cleaned);
    } else {
        const allowedChars = /^[0-9+\-*/().\s%^]+$/;
        if (!allowedChars.test(cleaned)) {
            return {
                success: false,
                result: null,
                error: "Invalid characters in expression"
            };
        }

        const hasOperator = /[+\-*/^%]/.test(cleaned);
        const isSimpleNumber = /^-?\d+\.?\d*$/.test(cleaned);

        if (!hasOperator && !isSimpleNumber) {
            return {
                success: false,
                result: null,
                error: "Not a valid mathematical expression"
            };
        }
    }

    try {
        let result;

        if (!hasFunctions && isIntegerOnly(cleaned) && !cleaned.includes('/')) {
            result = evaluateInteger(cleaned);
        }

        if (result === null || result === undefined) {
            result = evaluatePrecise(cleaned);
        }

        if (result === null || result === undefined) {
            return {
                success: false,
                result: null,
                error: "Evaluation failed"
            };
        }

        if (typeof result === 'number' && !isFinite(result)) {
            return {
                success: false,
                result: null,
                error: "Invalid result"
            };
        }

        return {
            success: true,
            result: result,
            error: null
        };
    } catch (e) {
        return {
            success: false,
            result: null,
            error: "Evaluation error: " + e.message
        };
    }
}

/**
 * Checks if a string looks like it could be a mathematical expression
 * @param {string} query - The query to check
 * @returns {boolean} - True if it looks like a math expression
 */
function isMathExpression(query) {
    if (!query || typeof query !== 'string') {
        return false;
    }

    const cleaned = query.trim();

    if (containsMathFunctions(cleaned)) {
        return validateMathExpression(cleaned);
    }

    const allowedChars = /^[0-9+\-*/().\s%^]+$/;
    if (!allowedChars.test(cleaned)) {
        return false;
    }

    if (!/\d/.test(cleaned)) {
        return false;
    }

    const hasOperator = /[+\-*/^%]/.test(cleaned);
    const isSimpleNumber = /^-?\d+\.?\d*$/.test(cleaned);

    return (hasOperator && cleaned.length >= 3) || isSimpleNumber;
}
