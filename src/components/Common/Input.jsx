import React from 'react';

const Input = ({ label, type = "text", name, value, onChange, placeholder, required = false, error }) => {
  return (
    <div className="form-group">
      {label && <label htmlFor={name}>{label}</label>}
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="form-control"
        placeholder={placeholder}
        required={required}
        style={error ? { borderColor: 'red' } : {}}
      />
      {error && <small style={{ color: 'red' }}>{error}</small>}
    </div>
  );
};

export default Input;
