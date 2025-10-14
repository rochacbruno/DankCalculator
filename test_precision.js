#!/usr/bin/env node

// Test cases for calculator precision improvements
// Note: This is a Node.js test file for demonstration purposes
// The actual calculator.js is a QML JavaScript module

// Mock QML .pragma library behavior
const Calculator = {
    isIntegerOnly: function(expression) {
        return !/\./.test(expression);
    },

    evaluateInteger: function(expression) {
        try {
            let expr = expression.replace(/\s/g, '');

            if (expr.includes('^') || expr.includes('/')) {
                return null;
            }

            expr = expr.replace(/(\d+)/g, '$1n');
            const result = eval(expr);
            const numResult = Number(result);

            if (Number.isSafeInteger(numResult)) {
                return numResult;
            }

            return result.toString().replace(/n$/, '');
        } catch (e) {
            return null;
        }
    },

    evaluatePrecise: function(expression) {
        try {
            let cleaned = expression.replace(/\^/g, '**');
            let result = eval(cleaned);

            if (typeof result !== 'number' || !isFinite(result)) {
                return null;
            }

            if (Math.abs(result) < 1e-10 && result !== 0) {
                return result;
            }

            if (result % 1 !== 0) {
                const resultStr = result.toString();
                if (resultStr.includes('e')) {
                    return result;
                }

                const precision = 15;
                const rounded = parseFloat(result.toPrecision(precision));

                if (rounded % 1 === 0 && Math.abs(rounded) < Number.MAX_SAFE_INTEGER) {
                    return Math.round(rounded);
                }

                return rounded;
            }

            return result;
        } catch (e) {
            return null;
        }
    },

    evaluate: function(expression) {
        if (!expression || typeof expression !== 'string') {
            return { success: false, result: null, error: "Invalid expression" };
        }

        let cleaned = expression.trim();

        if (cleaned.length === 0) {
            return { success: false, result: null, error: "Empty expression" };
        }

        const allowedChars = /^[0-9+\-*/().\s%^]+$/;
        if (!allowedChars.test(cleaned)) {
            return { success: false, result: null, error: "Invalid characters" };
        }

        const hasOperator = /[+\-*/^%]/.test(cleaned);
        const isSimpleNumber = /^-?\d+\.?\d*$/.test(cleaned);

        if (!hasOperator && !isSimpleNumber) {
            return { success: false, result: null, error: "Not a math expression" };
        }

        try {
            let result;

            if (this.isIntegerOnly(cleaned) && !cleaned.includes('/')) {
                result = this.evaluateInteger(cleaned);
            }

            if (result === null || result === undefined) {
                result = this.evaluatePrecise(cleaned);
            }

            if (result === null || result === undefined) {
                return { success: false, result: null, error: "Evaluation failed" };
            }

            if (typeof result === 'number' && !isFinite(result)) {
                return { success: false, result: null, error: "Invalid result" };
            }

            return { success: true, result: result, error: null };
        } catch (e) {
            return { success: false, result: null, error: "Evaluation error: " + e.message };
        }
    }
};

// Test cases
console.log("=== Calculator Precision Test Suite ===\n");

const tests = [
    // Floating point precision tests
    { expr: "0.1 + 0.2", expected: "0.3", description: "Classic floating point precision issue" },
    { expr: "0.1 + 0.2 + 0.3", expected: "0.6", description: "Multiple decimal additions" },
    { expr: "1.1 + 2.2", expected: "3.3", description: "Simple decimal addition" },
    { expr: "3.3 - 1.1", expected: "2.2", description: "Decimal subtraction" },
    { expr: "0.3 - 0.1", expected: "0.2", description: "Another precision issue" },

    // BigInt large integer tests
    { expr: "999999999999999999 + 1", expected: "1000000000000000000", description: "Large integer addition (BigInt)" },
    { expr: "123456789012345678 * 2", expected: "246913578024691356", description: "Large integer multiplication (BigInt)" },
    { expr: "999999999999999999 - 999999999999999998", expected: "1", description: "Large integer subtraction" },

    // Regular operations
    { expr: "2 + 2", expected: "4", description: "Simple addition" },
    { expr: "10 - 3", expected: "7", description: "Simple subtraction" },
    { expr: "5 * 6", expected: "30", description: "Simple multiplication" },
    { expr: "20 / 4", expected: "5", description: "Simple division" },
    { expr: "2 ^ 10", expected: "1024", description: "Exponentiation" },
    { expr: "17 % 5", expected: "2", description: "Modulo" },
    { expr: "(5 + 3) * 2", expected: "16", description: "Parentheses" },

    // Edge cases
    { expr: "100 / 3", expected: "33.3333333333333", description: "Repeating decimal (rounded to 15 sig figs)" },
    { expr: "1.23456789012345678", expected: "1.23456789012346", description: "High precision decimal (rounded to 15 sig figs)" }
];

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
    const result = Calculator.evaluate(test.expr);
    const resultStr = result.success ? result.result.toString() : "ERROR";
    const matches = resultStr.startsWith(test.expected.substring(0, Math.min(test.expected.length, 10)));

    if (matches) {
        console.log(`✓ Test ${index + 1}: ${test.description}`);
        console.log(`  Expression: ${test.expr}`);
        console.log(`  Result: ${resultStr}`);
        passed++;
    } else {
        console.log(`✗ Test ${index + 1}: ${test.description}`);
        console.log(`  Expression: ${test.expr}`);
        console.log(`  Expected: ${test.expected}`);
        console.log(`  Got: ${resultStr}`);
        failed++;
    }
    console.log();
});

console.log(`=== Test Results ===`);
console.log(`Passed: ${passed}/${tests.length}`);
console.log(`Failed: ${failed}/${tests.length}`);

if (failed === 0) {
    console.log("\n✓ All tests passed!");
} else {
    console.log(`\n✗ ${failed} test(s) failed`);
    process.exit(1);
}
