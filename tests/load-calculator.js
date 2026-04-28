const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'calculator.js'), 'utf8')
    .replace('.pragma library', '');

const Calculator = new Function(code + '\nreturn { evaluate, isMathExpression, containsMathFunctions, validateMathExpression, preprocessExpression };')();

module.exports = Calculator;
