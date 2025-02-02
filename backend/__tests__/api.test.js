const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const { parseExpression, generateTruthTable } = require('../logic');

const app = express();
app.use(bodyParser.json());

app.post('/api/generate', (req, res) => {
  const { expression } = req.body;
  try {
    const parsed = parseExpression(expression);
    const truthTable = generateTruthTable(parsed);
    res.json({ truthTable, variables: parsed.variables, expressionTree: parsed.tree });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

describe('POST /api/generate', () => {
  it('should generate truth table for valid expression with quantifiers', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ expression: 'forall(x, (P(x) -> Q(x)))' });
    expect(response.statusCode).toBe(200);
    // Assuming free variables are P and Q
    expect(response.body.variables).toEqual(['x', 'P', 'Q']);
    expect(response.body.truthTable.length).toBe(8); // 3 variables: 2^3
  });

  it('should return error for invalid expression', async () => {
    const response = await request(app)
      .post('/api/generate')
      .send({ expression: 'A &&& B' });
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});