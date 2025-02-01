// backend/server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { parseExpression, generateTruthTable } = require('./logic');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});