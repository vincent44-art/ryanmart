import React, { useState } from 'react';
// import { 
//   clearAllDataAPI,
//   clearPurchasesDataAPI,
//   clearSalesDataAPI,
//   clearCarExpensesDataAPI,
//   clearOtherExpensesDataAPI,
//   clearSalariesDataAPI,
//   clearInventoryDataAPI
// } from 'http://127.0.0.1:5000/api';


import { 
  clearAllDataAPI,
  clearPurchasesDataAPI,
  clearSalesDataAPI,
  clearCarExpensesDataAPI,
  clearOtherExpensesDataAPI,
  clearSalariesDataAPI,
  clearInventoryDataAPI
} from './apiHelpers';


const ClearDataModal = ({ show, onClose }) => {
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState(null);

  if (!show) return null;

  const handleClearData = async (type) => {
    if (!window.confirm(`Are you sure you want to clear ${type === 'all' ? 'ALL' : 'this'} data? This action cannot be undone.`)) {
      return;
    }

    setIsClearing(true);
    setError(null);

    try {
      switch (type) {
        case 'all':
          await clearAllDataAPI();
          break;
        case 'purchases':
          await clearPurchasesDataAPI();
          break;
        case 'sales':
          await clearSalesDataAPI();
          break;
        case 'inventory':
          await clearInventoryDataAPI();
          break;
        case 'car-expenses':
          await clearCarExpensesDataAPI();
          break;
  case 'other_expenses':
          await clearOtherExpensesDataAPI();
          break;
        case 'salaries':
          await clearSalariesDataAPI();
          break;
        default:
          // do nothing
          break;
      }
      onClose();
    } catch (err) {
      console.error(`Failed to clear ${type} data:`, err);
      setError(`Failed to clear ${type} data. Please try again.`);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-trash me-2"></i>Clear Data
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              disabled={isClearing}
            ></button>
          </div>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger mb-3">
                {error}
              </div>
            )}
            <p>Choose what data you want to clear:</p>
            <div className="d-grid gap-2">
              <button 
                className="btn btn-outline-primary"
                onClick={() => handleClearData('purchases')}
                disabled={isClearing}
              >
                {isClearing ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-cart-plus me-2"></i>
                )}
                Clear Purchases Data
              </button>
              <button 
                className="btn btn-outline-success"
                onClick={() => handleClearData('sales')}
                disabled={isClearing}
              >
                {isClearing ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-currency-exchange me-2"></i>
                )}
                Clear Sales Data
              </button>
              <button 
                className="btn btn-outline-info"
                onClick={() => handleClearData('inventory')}
                disabled={isClearing}
              >
                {isClearing ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-boxes me-2"></i>
                )}
                Clear Inventory Data
              </button>
              <button 
                className="btn btn-outline-warning"
                onClick={() => handleClearData('car-expenses')}
                disabled={isClearing}
              >
                {isClearing ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-car-front me-2"></i>
                )}
                Clear Car Expenses
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => handleClearData('other_expenses')}
                disabled={isClearing}
              >
                {isClearing ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-receipt me-2"></i>
                )}
                Clear Other Expenses
              </button>
              <button 
                className="btn btn-outline-dark"
                onClick={() => handleClearData('salaries')}
                disabled={isClearing}
              >
                {isClearing ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-people me-2"></i>
                )}
                Clear Salaries Data
              </button>
              <hr />
              <button 
                className="btn btn-danger"
                onClick={() => handleClearData('all')}
                disabled={isClearing}
              >
                {isClearing ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-exclamation-triangle me-2"></i>
                )}
                Clear All Data
              </button>
            </div>
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isClearing}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClearDataModal;