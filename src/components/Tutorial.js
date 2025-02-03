import React from 'react';

const samples = [
  '(A && B) -> C',
  'forall(x, (P(x) -> Q(x)))',
  '~A || (B && C)',
  'A <-> B',
  'exists(y, (~Y || Z))',
];

const Tutorial = () => (
  <div className="tutorial">
    <h2>How to Use</h2>
    <p>Enter your logical expression using the following symbols:</p>
    <ul>
      <li>~ : NOT</li>
      <li>&& : AND</li>
      <li>|| : OR</li>
      <li>-&gt; : IMPLIES</li>
      <li>&lt;-&gt; : EQUIVALENT</li>
      <li>forall(variable, expression) : ∀</li>
      <li>exists(variable, expression) : ∃</li>
    </ul>
    <h3>Sample Expressions</h3>
    <ul>
      {samples.map((expr, index) => (
        <li key={index}>{expr}</li>
      ))}
    </ul>
  </div>
);

export default Tutorial;