// backend/logic.js
const jsep = require('jsep');

// Add custom binary operators
jsep.addBinaryOp('&&', 10);
jsep.addBinaryOp('||', 10);
jsep.addBinaryOp('->', 5);
jsep.addBinaryOp('<->', 3);

// Add unary operators
jsep.addUnaryOp('~');

// No need to add 'forall' and 'exists' as operators; treat them as functions

const parseExpression = (expression) => {
  const tree = jsep(expression);
  const variables = new Set();

  const extractVariables = (node) => {
    if (node.type === 'Identifier') {
      variables.add(node.name);
    }
    if (node.type === 'CallExpression') {
      if (node.callee && node.callee.name && !['forall', 'exists'].includes(node.callee.name)) {
        variables.add(node.callee.name);
      }
      node.arguments.forEach(arg => extractVariables(arg));
    }
    if (node.left) extractVariables(node.left);
    if (node.right) extractVariables(node.right);
    if (node.argument) extractVariables(node.argument);
  };

  extractVariables(tree);
  return { tree, variables: Array.from(variables) };
};

const evaluateExpression = (tree, assignments) => {
  switch (tree.type) {
    case 'BinaryExpression':
      const left = evaluateExpression(tree.left, assignments);
      const right = evaluateExpression(tree.right, assignments);
      switch (tree.operator) {
        case '&&':
          return left && right;
        case '||':
          return left || right;
        case '->':
          return !left || right;
        case '<->':
          return left === right;
        default:
          throw new Error(`Unsupported operator: ${tree.operator}`);
      }
    case 'CallExpression':
      const funcName = tree.callee.name;
      switch (funcName) {
        case 'forall':
          if (tree.arguments.length !== 2) {
            throw new Error(`forall expects 2 arguments, got ${tree.arguments.length}`);
          }
          const [varNodeForall, exprNodeForall] = tree.arguments;
          if (varNodeForall.type !== 'Identifier') {
            throw new Error(`First argument of forall must be a variable`);
          }
          const varNameForall = varNodeForall.name;
          // Assuming binary variables for simplicity
          const uniqueValues = [false, true];
          return uniqueValues.every(value => {
            assignments[varNameForall] = value;
            const result = evaluateExpression(exprNodeForall, assignments);
            assignments[varNameForall] = undefined; // Reset
            return result;
          });
        case 'exists':
          if (tree.arguments.length !== 2) {
            throw new Error(`exists expects 2 arguments, got ${tree.arguments.length}`);
          }
          const [varNodeExists, exprNodeExists] = tree.arguments;
          if (varNodeExists.type !== 'Identifier') {
            throw new Error(`First argument of exists must be a variable`);
          }
          const varNameExists = varNodeExists.name;
          // Assuming binary variables for simplicity
          return [false, true].some(value => {
            assignments[varNameExists] = value;
            const result = evaluateExpression(exprNodeExists, assignments);
            assignments[varNameExists] = undefined; // Reset
            return result;
          });
        default:
          throw new Error(`Unsupported function: ${funcName}`);
      }
    case 'UnaryExpression':
      switch (tree.operator) {
        case '~':
          return !evaluateExpression(tree.argument, assignments);
        default:
          throw new Error(`Unsupported operator: ${tree.operator}`);
      }
    case 'Identifier':
      if (assignments.hasOwnProperty(tree.name)) {
        return assignments[tree.name];
      } else {
        throw new Error(`Undefined variable: ${tree.name}`);
      }
    default:
      throw new Error(`Unsupported expression type: ${tree.type}`);
  }
};

const generateTruthTable = (parsed) => {
  const { tree, variables } = parsed;

  // Separate quantified variables and free variables
  const quantifiedVars = [];
  const freeVars = [...new Set(variables.filter(v => !['forall', 'exists'].includes(v)))];

  const truthTable = [];

  // Calculate total rows based on free variables
  const numVars = freeVars.length;
  const totalRows = Math.pow(2, numVars);

  for (let i = 0; i < totalRows; i++) {
    const assignments = {};
    for (let j = 0; j < numVars; j++) {
      assignments[freeVars[j]] = Boolean((i >> (numVars - j - 1)) & 1);
    }
    try {
      const result = evaluateExpression(tree, assignments);
      truthTable.push({ ...assignments, result });
    } catch (error) {
      truthTable.push({ ...assignments, result: 'Error' });
    }
  }

  return truthTable;
};

module.exports = { parseExpression, generateTruthTable };