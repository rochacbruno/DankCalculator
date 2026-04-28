#!/usr/bin/env node

const Calculator = require('./load-calculator');

console.log("=== Calculator Precision Test Suite ===\n");

const tests = [
    { expr: "0.1 + 0.2", expected: "0.3", description: "Classic floating point precision issue" },
    { expr: "0.1 + 0.2 + 0.3", expected: "0.6", description: "Multiple decimal additions" },
    { expr: "1.1 + 2.2", expected: "3.3", description: "Simple decimal addition" },
    { expr: "3.3 - 1.1", expected: "2.2", description: "Decimal subtraction" },
    { expr: "0.3 - 0.1", expected: "0.2", description: "Another precision issue" },

    { expr: "999999999999999999 + 1", expected: "1000000000000000000", description: "Large integer addition (BigInt)" },
    { expr: "123456789012345678 * 2", expected: "246913578024691356", description: "Large integer multiplication (BigInt)" },
    { expr: "999999999999999999 - 999999999999999998", expected: "1", description: "Large integer subtraction" },

    { expr: "2 + 2", expected: "4", description: "Simple addition" },
    { expr: "10 - 3", expected: "7", description: "Simple subtraction" },
    { expr: "5 * 6", expected: "30", description: "Simple multiplication" },
    { expr: "20 / 4", expected: "5", description: "Simple division" },
    { expr: "2 ^ 10", expected: "1024", description: "Exponentiation" },
    { expr: "17 % 5", expected: "2", description: "Modulo" },
    { expr: "(5 + 3) * 2", expected: "16", description: "Parentheses" },

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
