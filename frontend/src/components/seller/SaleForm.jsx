
import React, { useMemo, useState } from 'react';

const SaleForm = ({ 
  formData, 
  handleChange, 
  handleSubmit, 
  userAssignments, 
  user,
  stockRecords = []
}) => {
  const [showStockDetails, setShowStockDetails] = useState(false);

  const stockOutOptions = useMemo(() => {
    return (stockRecords || []).map(r => ({
      id: r.id,
      label: `${r.stockName} | ${r.fruitType} | In: ${r.dateIn} | Out: ${r.dateOut}`,
      data: r
    }));
  }, [stockRecords]);

  const selectedStock = useMemo(() => {
    return stockRecords.find(r => String(r.id) === String(formData.stockTrackingId));
  }, [stockRecords, formData.stockTrackingId]);

  const handleView = (e) => {
    e.preventDefault();
    setShowStockDetails(true);
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-success text-white">
        <h4 className="mb-0">
          <i className="bi bi-graph-up me-2"></i>
          Record Sale
        </h4>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Stock Name (from Storekeeper Stock-Out)</label>
            <div className="d-flex gap-2">
              <select
                className="form-select"
                name="stockTrackingId"
                value={formData.stockTrackingId || ''}
                onChange={handleChange}
                required
              >
                <option value="">Select Stock</option>
                {stockOutOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
              <button className="btn btn-outline-primary" onClick={handleView} disabled={!formData.stockTrackingId}>
                <i className="bi bi-eye me-1"></i>
                View
              </button>
            </div>
            {showStockDetails && selectedStock && (
              <div className="alert alert-info mt-2">
                <div><strong>Stock Name:</strong> {selectedStock.stockName}</div>
                <div><strong>Fruit Type:</strong> {selectedStock.fruitType}</div>
                <div><strong>Date In:</strong> {selectedStock.dateIn}</div>
                <div><strong>Date Out:</strong> {selectedStock.dateOut}</div>
                <div><strong>Quantity In:</strong> {selectedStock.quantityIn}</div>
                {selectedStock.quantityOut && (
                  <div><strong>Quantity Out:</strong> {selectedStock.quantityOut}</div>
                )}
                {selectedStock.totalStockCost && (
                  <div><strong>Total Stock Cost:</strong> {selectedStock.totalStockCost}</div>
                )}
              </div>
            )}
          </div>
          
          <button type="submit" className="btn btn-success">
            <i className="bi bi-plus-circle me-2"></i>
            Add to Table
          </button>
        </form>
      </div>
    </div>
  );
};

export default SaleForm;
