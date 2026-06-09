import React from 'react';
import './Alert.css'; // Assuming you might want specific styles, or use utility classes

const Alert = ({ type = 'info', message, onClose }) => {
  if (!message) return null;

  const alertStyles = {
    success: 'alert alert-success',
    error: 'alert alert-error',
    warning: 'alert alert-warning',
    info: 'alert alert-info'
  };

  return (
    <div className={alertStyles[type] || 'alert alert-info'} style={styles.alert}>
      <span>{message}</span>
      {onClose && <button onClick={onClose} style={styles.closeBtn}>&times;</button>}
    </div>
  );
};

const styles = {
  alert: {
    padding: '10px 15px',
    borderRadius: '4px',
    marginBottom: '15px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#fff',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
    marginLeft: '10px'
  }
};

export default Alert;
