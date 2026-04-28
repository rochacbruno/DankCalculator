#!/usr/bin/env node

const Calculator = require('./load-calculator');

console.log("=== Calculator Math Functions Test Suite ===\n");

const tests = [
    // --- Trigonometric (radians) ---
    { expr: "sin(0)", expected: 0, description: "sin(0) = 0" },
    { expr: "sin(pi/2)", expected: 1, description: "sin(pi/2) = 1" },
    { expr: "cos(0)", expected: 1, description: "cos(0) = 1" },
    { expr: "cos(pi)", expected: -1, description: "cos(pi) = -1" },
    { expr: "tan(0)", expected: 0, description: "tan(0) = 0" },

    // --- Trigonometric (degrees) ---
    { expr: "sind(0)", expected: 0, description: "sind(0) = 0" },
    { expr: "sind(30)", expected: 0.5, description: "sind(30) = 0.5" },
    { expr: "sind(90)", expected: 1, description: "sind(90) = 1" },
    { expr: "cosd(0)", expected: 1, description: "cosd(0) = 1" },
    { expr: "cosd(60)", expected: 0.5, description: "cosd(60) = 0.5" },
    { expr: "cosd(90)", expected: 0, description: "cosd(90) = 0" },
    { expr: "tand(0)", expected: 0, description: "tand(0) = 0" },
    { expr: "tand(45)", expected: 1, description: "tand(45) = 1" },
    { expr: "sind(45 + 45)", expected: 1, description: "sind with nested expression" },

    // --- Inverse trigonometric ---
    { expr: "asin(0)", expected: 0, description: "asin(0) = 0" },
    { expr: "asin(1)", expected: Math.PI / 2, description: "asin(1) = pi/2" },
    { expr: "acos(1)", expected: 0, description: "acos(1) = 0" },
    { expr: "acos(0)", expected: Math.PI / 2, description: "acos(0) = pi/2" },
    { expr: "atan(0)", expected: 0, description: "atan(0) = 0" },
    { expr: "atan(1)", expected: Math.PI / 4, description: "atan(1) = pi/4" },
    { expr: "atan2(1, 1)", expected: Math.PI / 4, description: "atan2(1,1) = pi/4" },

    // --- Hyperbolic ---
    { expr: "sinh(0)", expected: 0, description: "sinh(0) = 0" },
    { expr: "cosh(0)", expected: 1, description: "cosh(0) = 1" },
    { expr: "tanh(0)", expected: 0, description: "tanh(0) = 0" },
    { expr: "asinh(0)", expected: 0, description: "asinh(0) = 0" },
    { expr: "acosh(1)", expected: 0, description: "acosh(1) = 0" },
    { expr: "atanh(0)", expected: 0, description: "atanh(0) = 0" },

    // --- Logarithmic ---
    { expr: "log(1)", expected: 0, description: "log(1) = 0 (base 10)" },
    { expr: "log(10)", expected: 1, description: "log(10) = 1" },
    { expr: "log(100)", expected: 2, description: "log(100) = 2" },
    { expr: "log(1000)", expected: 3, description: "log(1000) = 3" },
    { expr: "ln(1)", expected: 0, description: "ln(1) = 0 (natural)" },
    { expr: "ln(e)", expected: 1, description: "ln(e) = 1" },

    // --- Exponential ---
    { expr: "exp(0)", expected: 1, description: "exp(0) = 1" },
    { expr: "exp(1)", expected: Math.E, description: "exp(1) = e" },
    { expr: "pow(2, 10)", expected: 1024, description: "pow(2, 10) = 1024" },
    { expr: "pow(3, 3)", expected: 27, description: "pow(3, 3) = 27" },

    // --- Roots ---
    { expr: "sqrt(4)", expected: 2, description: "sqrt(4) = 2" },
    { expr: "sqrt(144)", expected: 12, description: "sqrt(144) = 12" },
    { expr: "sqrt(2)", expected: Math.SQRT2, description: "sqrt(2) = 1.4142..." },
    { expr: "cbrt(8)", expected: 2, description: "cbrt(8) = 2" },
    { expr: "cbrt(27)", expected: 3, description: "cbrt(27) = 3" },

    // --- Rounding ---
    { expr: "floor(3.7)", expected: 3, description: "floor(3.7) = 3" },
    { expr: "floor(-3.2)", expected: -4, description: "floor(-3.2) = -4" },
    { expr: "ceil(3.2)", expected: 4, description: "ceil(3.2) = 4" },
    { expr: "ceil(-3.7)", expected: -3, description: "ceil(-3.7) = -3" },
    { expr: "round(3.5)", expected: 4, description: "round(3.5) = 4" },
    { expr: "round(3.4)", expected: 3, description: "round(3.4) = 3" },
    { expr: "trunc(3.9)", expected: 3, description: "trunc(3.9) = 3" },
    { expr: "trunc(-3.9)", expected: -3, description: "trunc(-3.9) = -3" },

    // --- Other functions ---
    { expr: "abs(-5)", expected: 5, description: "abs(-5) = 5" },
    { expr: "abs(5)", expected: 5, description: "abs(5) = 5" },
    { expr: "min(3, 7)", expected: 3, description: "min(3, 7) = 3" },
    { expr: "min(10, 2, 5)", expected: 2, description: "min(10, 2, 5) = 2" },
    { expr: "max(3, 7)", expected: 7, description: "max(3, 7) = 7" },
    { expr: "max(1, 9, 4)", expected: 9, description: "max(1, 9, 4) = 9" },

    // --- Constants ---
    { expr: "pi", expected: Math.PI, description: "pi constant" },
    { expr: "pi * 2", expected: Math.PI * 2, description: "pi * 2" },
    { expr: "e", expected: Math.E, description: "e constant" },
    { expr: "e ^ 2", expected: Math.E ** 2, description: "e ^ 2" },

    // --- Composite expressions ---
    { expr: "2 + sqrt(9)", expected: 5, description: "2 + sqrt(9)" },
    { expr: "sin(0) + cos(0)", expected: 1, description: "sin(0) + cos(0)" },
    { expr: "sqrt(pow(3, 2) + pow(4, 2))", expected: 5, description: "Pythagorean: sqrt(3^2 + 4^2) = 5" },
    { expr: "log(10) + ln(1)", expected: 1, description: "log(10) + ln(1) = 1" },
    { expr: "abs(floor(-3.5)) + ceil(2.1)", expected: 7, description: "abs(floor(-3.5)) + ceil(2.1) = 7" },
    { expr: "pow(sqrt(16), 2)", expected: 16, description: "pow(sqrt(16), 2) = 16" },
    { expr: "sind(30) * 2", expected: 1, description: "sind(30) * 2 = 1" },
    { expr: "min(sqrt(9), sqrt(16))", expected: 3, description: "min(sqrt(9), sqrt(16)) = 3" },

    // --- Case insensitivity ---
    { expr: "SIN(0)", expected: 0, description: "SIN (uppercase) works" },
    { expr: "PI * 2", expected: Math.PI * 2, description: "PI (uppercase) works" },
    { expr: "Sqrt(16)", expected: 4, description: "Sqrt (mixed case) works" },

    // --- isMathExpression recognition ---
    { expr: "sin(1)", expected: Math.sin(1), description: "sin(1) recognized and evaluated" },
    { expr: "pi", expected: Math.PI, description: "standalone pi recognized" },
    { expr: "e", expected: Math.E, description: "standalone e recognized" },

    // --- Backward compatibility: arithmetic still works ---
    { expr: "0.1 + 0.2", expected: 0.3, description: "Precision preserved: 0.1 + 0.2 = 0.3" },
    { expr: "2 ^ 10", expected: 1024, description: "Exponentiation still works" },
    { expr: "(5 + 3) * 2", expected: 16, description: "Parentheses still work" },
    { expr: "17 % 5", expected: 2, description: "Modulo still works" },
];

const rejectTests = [
    { expr: "alert(1)", description: "Rejects alert()" },
    { expr: "console.log(1)", description: "Rejects console.log()" },
    { expr: 'require("fs")', description: "Rejects require()" },
    { expr: "eval(1)", description: "Rejects eval()" },
    { expr: "Function('return 1')()", description: "Rejects Function constructor" },
    { expr: "window", description: "Rejects window" },
    { expr: "process.exit(1)", description: "Rejects process.exit()" },
    { expr: "import('fs')", description: "Rejects import()" },
    { expr: "fetch('http://evil.com')", description: "Rejects fetch()" },
    { expr: "sin(1); alert(1)", description: "Rejects semicolon injection" },
];

let passed = 0;
let failed = 0;

tests.forEach((test, index) => {
    const isMath = Calculator.isMathExpression(test.expr);
    const result = Calculator.evaluate(test.expr);

    if (!isMath) {
        console.log(`✗ Test ${index + 1}: ${test.description}`);
        console.log(`  Expression: ${test.expr}`);
        console.log(`  isMathExpression returned false`);
        failed++;
        console.log();
        return;
    }

    if (!result.success) {
        console.log(`✗ Test ${index + 1}: ${test.description}`);
        console.log(`  Expression: ${test.expr}`);
        console.log(`  Evaluation failed: ${result.error}`);
        failed++;
        console.log();
        return;
    }

    const actual = result.result;
    let match = false;
    if (typeof test.expected === 'number' && typeof actual === 'number') {
        match = Math.abs(actual - test.expected) < 1e-10;
    } else {
        match = String(actual) === String(test.expected);
    }

    if (match) {
        console.log(`✓ Test ${index + 1}: ${test.description}`);
        console.log(`  Expression: ${test.expr}`);
        console.log(`  Result: ${actual}`);
        passed++;
    } else {
        console.log(`✗ Test ${index + 1}: ${test.description}`);
        console.log(`  Expression: ${test.expr}`);
        console.log(`  Expected: ${test.expected}`);
        console.log(`  Got: ${actual}`);
        failed++;
    }
    console.log();
});

console.log("=== Security Rejection Tests ===\n");

rejectTests.forEach((test, index) => {
    const isMath = Calculator.isMathExpression(test.expr);
    const result = Calculator.evaluate(test.expr);
    const rejected = !isMath || !result.success;

    if (rejected) {
        console.log(`✓ Reject ${index + 1}: ${test.description}`);
        passed++;
    } else {
        console.log(`✗ Reject ${index + 1}: ${test.description}`);
        console.log(`  DANGER: expression was evaluated to: ${result.result}`);
        failed++;
    }
    console.log();
});

const total = tests.length + rejectTests.length;
console.log(`=== Test Results ===`);
console.log(`Passed: ${passed}/${total}`);
console.log(`Failed: ${failed}/${total}`);

if (failed === 0) {
    console.log("\n✓ All tests passed!");
} else {
    console.log(`\n✗ ${failed} test(s) failed`);
    process.exit(1);
}
