import React from 'react';
import './Modal.css'; // Ensure this handles the overlay styles

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal open">
      <div className="modal-content">
        <span className="modal-close" onClick={onClose}>&times;</span>
        <h2>{title}</h2>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
