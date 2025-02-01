import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setExpression } from '../redux/actions';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import Tooltip from './Tooltip';

const ExpressionInput = () => {
  const [input, setInput] = useState('');
  const dispatch = useDispatch();

  const handleChange = (e) => {
    const value = e.target.value;
    setInput(value);
    dispatch(setExpression(value));
  };

  return (
    <div className="expression-input">
      <label htmlFor="logic-expression">Enter Logical Expression:</label>
      <Tooltip content="Use ~ for NOT, && for AND, || for OR, -> for IMPLIES, <-> for EQUIVALENT, forall(variable, expression) for ∀, exists(variable, expression) for ∃.">
        <div style={{ position: 'relative' }}>
          <SyntaxHighlighter language="javascript" style={docco}>
            {input}
          </SyntaxHighlighter>
          <input
            type="text"
            id="logic-expression"
            value={input}
            onChange={handleChange}
            placeholder="e.g., forall(x, (P(x) -> Q(x)))"
            style={{
              opacity: 0,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
          />
        </div>
      </Tooltip>
    </div>
  );
};

export default ExpressionInput;