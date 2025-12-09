
import React from 'react';

const CurrentStockTable = ({ currentStock, onClearAll }) => {
  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6>Current Stock Summary</h6>
        <button 
          className="btn btn-outline-danger btn-sm"
          onClick={onClearAll}
        >
          <i className="bi bi-trash me-1"></i>Clear All
        </button>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {currentStock.map((item, index) => (
                <tr key={index}>
                  <td>
                    <i className="bi bi-apple me-2 text-success"></i>
                    {item.fruitType}
                  </td>
                  <td>
                    <span className="badge bg-primary">
                      {item.quantity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {currentStock.length === 0 && (
            <p className="text-center text-muted">No stock available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentStockTable;
