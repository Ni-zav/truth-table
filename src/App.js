import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import debounce from 'lodash.debounce';
import ExpressionInput from './components/ExpressionInput';
import TruthTable from './components/TruthTable';
import ExpressionTree from './components/ExpressionTree';
import ExportButtons from './components/ExportButtons';
import ErrorMessage from './components/ErrorMessage';
import Tutorial from './components/Tutorial';
import { setTruthTable, setError } from './redux/actions';
import './App.css';

function App() {
  const expression = useSelector((state) => state.expression);
  const dispatch = useDispatch();

  const fetchTruthTable = async (expr) => {
    if (expr.trim() === '') {
      dispatch(setTruthTable([], [], null));
      return;
    }
    try {
      const response = await axios.post('/api/generate', { expression: expr });
      const { truthTable, variables, expressionTree } = response.data;
      dispatch(setTruthTable(truthTable, variables, expressionTree));
    } catch (error) {
      dispatch(setError(error.response?.data?.error || 'Error generating truth table'));
    }
  };

  const debouncedFetch = React.useCallback(debounce(fetchTruthTable, 500), []);

  useEffect(() => {
    debouncedFetch(expression);
  }, [expression, debouncedFetch]);

  return (
    <div className="container">
      <h1>Truth Table Generator</h1>
      <div className="left-panel">
        <Tutorial />
        <ExpressionInput />
      </div>
      <div className="right-panel">
        <div className="export-buttons-container">
          <ExportButtons />
        </div>
        <TruthTable />
      </div>
      <ExpressionTree />
      <footer>&copy; Nizav</footer>
    </div>
  );
}

export default App;