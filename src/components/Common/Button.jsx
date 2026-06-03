import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, style }) => {
  const variantClass = `btn btn-${variant}`;
  
  return (
    <button
      type={type}
      className={variantClass}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
};

export default Button;