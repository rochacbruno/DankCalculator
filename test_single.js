// Quick test for the specific case
const fs = require('fs');

// Load and parse the calculator.js file (QML pragma library style)
const calcCode = fs.readFileSync('./calculator.js', 'utf8')
    .replace('.pragma library', ''); // Remove QML pragma

// Create a function wrapper to execute the code
const Calculator = new Function(calcCode + '\nreturn { isMathExpression, evaluate };')();

// Test the specific case
const testValue = '99999999999';
console.log('Testing:', testValue);
console.log('---');

const isMath = Calculator.isMathExpression(testValue);
console.log('isMathExpression:', isMath);

if (isMath) {
    const result = Calculator.evaluate(testValue);
    console.log('Evaluation success:', result.success);
    console.log('Result value:', result.result);
    console.log('Result type:', typeof result.result);

    if (result.success) {
        const str = result.result.toString();
        console.log('String representation:', str);
        console.log('String length:', str.length);
        console.log('---');
        console.log('Would convert to scientific notation?');
        console.log('  Length > 15?', str.length > 15, `(actual: ${str.length})`);
        console.log('  Abs value >= 1e6?', Math.abs(result.result) >= 1e6, `(actual: ${result.result})`);
        console.log('  RESULT:', (str.length > 15 && Math.abs(result.result) >= 1e6) ? 'YES - would use scientific' : 'NO - would display normally');

        if (str.length > 15 && Math.abs(result.result) >= 1e6) {
            console.log('  Scientific notation:', result.result.toExponential(6));
        }
    }
}
