import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setExpression } from '../redux/actions';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import './ExpressionInput.css';

const ExpressionInput = () => {
  const [input, setInput] = useState('');
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);
    dispatch(setExpression(value));
  };

  return (
    <div className="expression-input-container">
      <label htmlFor="logic-expression" className="expression-label">Enter Logical Expression:</label>
      <div className="input-wrapper">
        <SyntaxHighlighter language="javascript" style={docco} className="syntax-highlighter">
          {input}
        </SyntaxHighlighter>
        <input
          type="text"
          id="logic-expression"
          value={input}
          onChange={handleChange}
          placeholder="e.g., forall(x, (P(x) -> Q(x)))"
          className="expression-input-field"
        />
      </div>
    </div>
  );
};

export default ExpressionInput;