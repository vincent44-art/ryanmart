import React from 'react';

const PurchaseFormModal = ({ show, onClose, onAddPurchase }) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Purchase Form (Placeholder)</h3>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default PurchaseFormModal;
