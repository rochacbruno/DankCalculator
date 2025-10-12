// Calculator utility for safe mathematical expression evaluation
.pragma library

/**
 * Safely evaluates a mathematical expression
 * @param {string} expression - The mathematical expression to evaluate
 * @returns {object} - {success: boolean, result: number|null, error: string|null}
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
        // Replace ^ with ** for exponentiation
        cleaned = cleaned.replace(/\^/g, '**');

        // Evaluate using JavaScript's eval (safe because we validated the input)
        const result = eval(cleaned);

        // Check if result is a valid number
        if (typeof result !== 'number' || !isFinite(result)) {
            return {
                success: false,
                result: null,
                error: "Invalid result"
            };
        }

        // Round to reasonable precision (14 decimal places)
        const rounded = Math.round(result * 1e14) / 1e14;

        return {
            success: true,
            result: rounded,
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
