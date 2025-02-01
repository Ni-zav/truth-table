import React from 'react';
import './Tooltip.css';

const Tooltip = ({ children, content }) => (
  <div className="tooltip-container">
    {children}
    <span className="tooltip-text">{content}</span>
  </div>
);

export default Tooltip;