import { SET_EXPRESSION, SET_TRUTH_TABLE, SET_ERROR } from './actions';

const initialState = {
  expression: '',
  truthTable: [],
  variables: [],
  expressionTree: null,
  error: null,
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_EXPRESSION:
      return { ...state, expression: action.payload, error: null };
    case SET_TRUTH_TABLE:
      return {
        ...state,
        truthTable: action.payload.truthTable,
        variables: action.payload.variables,
        expressionTree: action.payload.expressionTree,
        error: null,
      };
    case SET_ERROR:
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export default rootReducer;