// Calculator utility for safe mathematical expression evaluation
.pragma library

/**
 * Checks if expression contains only integers (no decimals)
 */
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

    // Clean the expression
    let cleaned = expression.trim();

    // Check if it's empty
    if (cleaned.length === 0) {
        return {
            success: false,
            result: null,
            error: "Empty expression"
        };
    }

    // Only allow numbers, basic operators, parentheses, dots, and spaces
    const allowedChars = /^[0-9+\-*/().\s%^]+$/;
    if (!allowedChars.test(cleaned)) {
        return {
            success: false,
            result: null,
            error: "Invalid characters in expression"
        };
    }

    // Check if it looks like a mathematical expression
    // Must contain at least one operator or be a simple number
    const hasOperator = /[+\-*/^%]/.test(cleaned);
    const isSimpleNumber = /^-?\d+\.?\d*$/.test(cleaned);

    if (!hasOperator && !isSimpleNumber) {
        return {
            success: false,
            result: null,
            error: "Not a valid mathematical expression"
        };
    }

    try {
        let result;

        // Try BigInt evaluation for integer-only expressions (better precision for large integers)
        if (isIntegerOnly(cleaned) && !cleaned.includes('/')) {
            result = evaluateInteger(cleaned);
        }

        // Fall back to precise decimal evaluation
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

        // Check if result is valid
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

    // Must contain only allowed characters
    const allowedChars = /^[0-9+\-*/().\s%^]+$/;
    if (!allowedChars.test(cleaned)) {
        return false;
    }

    // Must have at least one digit
    if (!/\d/.test(cleaned)) {
        return false;
    }

    // Must be at least 3 characters for an expression (e.g., "1+1")
    // or be a simple number
    const hasOperator = /[+\-*/^%]/.test(cleaned);
    const isSimpleNumber = /^-?\d+\.?\d*$/.test(cleaned);

    return (hasOperator && cleaned.length >= 3) || isSimpleNumber;
}
