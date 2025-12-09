import React from 'react';

const AddedItemsTable = ({ inventory, onClearAll }) => {
  const items = Array.isArray(inventory) ? inventory : [];
  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6>All Added Items</h6>
        <button 
          className="btn btn-outline-danger btn-sm"
          onClick={onClearAll}
        >
          <i className="bi bi-trash me-1"></i>Clear All
        </button>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Date</th>
                <th>Fruit Type</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Location</th>
                <th>Supplier</th>
                <th>Expiry Date</th>
                <th>Added By</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(-20).reverse().map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>
                    <i className="bi bi-apple me-1 text-success"></i>
                    {item.fruitType}
                  </td>
                  <td>
                    <span className="badge bg-success">
                      {item.quantity}
                    </span>
                  </td>
                  <td>{item.unit}</td>
                  <td>{item.location}</td>
                  <td>{item.supplierName}</td>
                  <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td>{item.storeKeeperName}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {inventory.length === 0 && (
            <p className="text-center text-muted">No items added yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddedItemsTable;
