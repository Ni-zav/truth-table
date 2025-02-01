import React from 'react';
import { useSelector } from 'react-redux';

const ErrorMessage = () => {
  const error = useSelector((state) => state.error);

  if (!error) return null;

  return <div className="error-message">{error}</div>;
};

export default ErrorMessage;