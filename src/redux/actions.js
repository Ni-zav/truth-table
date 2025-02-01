export const SET_EXPRESSION = 'SET_EXPRESSION';
export const SET_TRUTH_TABLE = 'SET_TRUTH_TABLE';
export const SET_ERROR = 'SET_ERROR';

export const setExpression = (expression) => ({
  type: SET_EXPRESSION,
  payload: expression,
});

export const setTruthTable = (truthTable, variables, expressionTree) => ({
  type: SET_TRUTH_TABLE,
  payload: { truthTable, variables, expressionTree },
});

export const setError = (error) => ({
  type: SET_ERROR,
  payload: error,
});