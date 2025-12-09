import React from 'react';

const SalaryFormModal = ({ show, onClose }) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Salary Form (Placeholder)</h3>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default SalaryFormModal;
