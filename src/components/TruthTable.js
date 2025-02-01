import React from 'react';
import { useSelector } from 'react-redux';

const TruthTable = () => {
  const truthTable = useSelector((state) => state.truthTable);
  const variables = useSelector((state) => state.variables);

  if (!truthTable || truthTable.length === 0) {
    return <div className="truth-table">No truth table to display.</div>;
  }

  return (
    <div className="truth-table">
      <table>
        <thead>
          <tr>
            {variables.map((variable) => (
              <th key={variable}>{variable}</th>
            ))}
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          {truthTable.map((row, index) => (
            <tr key={index}>
              {variables.map((variable) => (
                <td key={`${index}-${variable}`}>
                  {row[variable] ? 'T' : 'F'}
                </td>
              ))}
              <td>{row.result ? 'T' : 'F'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TruthTable;