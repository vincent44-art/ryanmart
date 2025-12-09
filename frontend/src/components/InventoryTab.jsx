import React, { useState, useEffect } from 'react';
// import { 
//   fetchInventory,
//   fetchStockMovements,
//   fetchGradients,
//   clearInventoryAPI,
//   clearStockMovementsAPI,
//   clearGradientsAPI
// } from 'http://127.0.0.1:5000/api';

import { 
  fetchInventory,
  fetchStockMovements,
  fetchGradients,
  clearInventoryAPI,
  clearStockMovementsAPI,
  clearGradientsAPI,
  createInventory
} from './apiHelpers';  // adjust path as needed
// import { useAuth } from '../contexts/AuthContext';

const InventoryTab = () => {
  const [inventory, setInventory] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [gradients, setGradients] = useState([]);
  const [loading, setLoading] = useState({
    inventory: true,
    movements: true,
    gradients: true
  });
  const [error, setError] = useState(null);
  // const { user } = useAuth(); // removed unused user
  const [form, setForm] = useState({
    fruitType: '',
    quantity: '',
    unit: 'kg',
    location: '',
    supplierName: '',
    expiryDate: '',
    date: ''
  });
  const [adding, setAdding] = useState(false);

  // Fetch all inventory data
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const [inventoryRes, movementsRes, gradientsRes] = await Promise.all([
          fetchInventory(token),
          fetchStockMovements(token),
          fetchGradients(token)
        ]);
        
        setInventory(inventoryRes.data);
        // Ensure stockMovements is always an array
        setStockMovements(Array.isArray(movementsRes.data) ? movementsRes.data : []);
        setGradients(gradientsRes.data);
      } catch (err) {
        console.error('Failed to load inventory data:', err);
        setError('Failed to load inventory data. Please try again.');
      } finally {
        setLoading({
          inventory: false,
          movements: false,
          gradients: false
        });
      }
    };
    loadData();
  }, []);

  // Calculate current stock
  // Removed unused getCurrentStock function

  // const currentStock = getCurrentStock(); // removed unused currentStock
  const totalStockMovements = stockMovements.length;
  const totalGradients = gradients.length;

  const handleClearData = async (type) => {
    if (!window.confirm(`Are you sure you want to clear all ${type}?`)) return;

    try {
      switch (type) {
        case 'inventory':
          await clearInventoryAPI();
          setInventory([]);
          break;
        case 'movements':
          await clearStockMovementsAPI();
          setStockMovements([]);
          break;
        case 'gradients':
          await clearGradientsAPI();
          setGradients([]);
          break;
        default:
          // do nothing
          break;
      }
    } catch (err) {
      console.error(`Failed to clear ${type}:`, err);
      setError(`Failed to clear ${type}. Please try again.`);
    }
  };

  const handleFormChange = (newForm) => setForm(newForm);

  const handleAddInventory = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const token = localStorage.getItem('access_token');
      const payload = {
        name: form.fruitType,
        quantity: form.quantity,
        fruit_type: form.fruitType,
        unit: form.unit,
        location: form.location,
        expiry_date: form.expiryDate
      };
      await createInventory(payload, token);
      setForm({ fruitType: '', quantity: '', unit: 'kg', location: '', supplierName: '', expiryDate: '', date: '' });
      // Refresh inventory
      const inventoryRes = await fetchInventory(token);
      setInventory(inventoryRes.data);
    } catch (err) {
      setError('Failed to add inventory. Please try again.');
      console.error('Error adding inventory:', err);
    } finally {
      setAdding(false);
    }
  };

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
        <button 
          className="btn btn-sm btn-outline-danger ms-3"
          onClick={() => setError(null)}
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card bg-success text-white shadow-lg">
            <div className="card-body">
              <h5><i className="bi bi-boxes me-2"></i>Current Stock Items</h5>
              <h3>
                {loading.inventory ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  inventory.length
                )}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-warning text-white shadow-lg">
            <div className="card-body">
              <h5><i className="bi bi-arrow-left-right me-2"></i>Stock Movements</h5>
              <h3>
                {loading.movements ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  totalStockMovements
                )}
              </h3>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-info text-white shadow-lg">
            <div className="card-body">
              <h5><i className="bi bi-droplet me-2"></i>Gradients Applied</h5>
              <h3>
                {loading.gradients ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  totalGradients
                )}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card shadow-lg border-0 fruit-card">
            <div className="card-header bg-gradient text-white d-flex justify-content-between align-items-center">
              <h5><i className="bi bi-boxes me-2"></i>Current Inventory</h5>
              <button 
                className="btn btn-outline-light btn-sm"
                onClick={() => handleClearData('inventory')}
                disabled={loading.inventory || inventory.length === 0}
              >
                <i className="bi bi-trash me-1"></i>Clear All
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive max-height-200">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Name</th>
                      <th>Qty</th>
                      <th>Fruit Type</th>
                      <th>Unit</th>
                      <th>Location</th>
                      <th>Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.inventory ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Loading inventory...
                        </td>
                      </tr>
                    ) : inventory.length > 0 ? (
                      inventory.map((item, index) => (
                        <tr key={item.id || index}>
                          <td>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{item.fruit_type}</td>
                          <td>{item.unit}</td>
                          <td>{item.location}</td>
                          <td>{item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : ''}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">No inventory available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-lg border-0 fruit-card">
            <div className="card-header bg-gradient text-white d-flex justify-content-between align-items-center">
              <h5><i className="bi bi-arrow-left-right me-2"></i>Recent Stock Movements</h5>
              <button 
                className="btn btn-outline-light btn-sm"
                onClick={() => handleClearData('movements')}
                disabled={loading.movements || stockMovements.length === 0}
              >
                <i className="bi bi-trash me-1"></i>Clear All
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive max-height-200">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Fruit Type</th>
                      <th>Movement</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.movements ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4">
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Loading movements...
                        </td>
                      </tr>
                    ) : stockMovements.length > 0 ? (
                      [...stockMovements]
                        .slice(-10)
                        .reverse()
                        .map((movement) => (
                          <tr key={movement.id}>
                            <td>
                              <i className="bi bi-apple me-1 text-success"></i>
                              {movement.fruitType}
                            </td>
                            <td>
                              <span className={`badge ${movement.movementType && movement.movementType.toLowerCase() === 'in' ? 'bg-success' : 'bg-danger'}`}>
                                {typeof movement.movementType === 'string' ? movement.movementType.toUpperCase() : ''}
                              </span>
                            </td>
                            <td>{movement.quantity}</td>
                            <td>{movement.unit}</td>
                            <td>{new Date(movement.date).toLocaleDateString()}</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-muted">No stock movements recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12">
          <div className="card shadow-lg border-0 fruit-card">
            <div className="card-header bg-gradient text-white d-flex justify-content-between align-items-center">
              <h5><i className="bi bi-droplet me-2"></i>Recent Gradients Applied</h5>
              <button 
                className="btn btn-outline-light btn-sm"
                onClick={() => handleClearData('gradients')}
                disabled={loading.gradients || gradients.length === 0}
              >
                <i className="bi bi-trash me-1"></i>Clear All
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive max-height-200">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Date</th>
                      <th>Gradient</th>
                      <th>Fruit Type</th>
                      <th>Quantity</th>
                      <th>Purpose</th>
                      <th>Store Keeper</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.gradients ? (
                      <tr>
                        <td colSpan="6" className="text-center py-4">
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Loading gradients...
                        </td>
                      </tr>
                    ) : gradients.length > 0 ? (
                      [...gradients]
                        .slice(-10)
                        .reverse()
                        .map((gradient) => (
                          <tr key={gradient.id}>
                            <td>{new Date(gradient.applicationDate).toLocaleDateString()}</td>
                            <td>
                              <span className="badge bg-info">
                                {gradient.gradientName}
                              </span>
                            </td>
                            <td>
                              <i className="bi bi-apple me-1 text-success"></i>
                              {gradient.fruitType}
                            </td>
                            <td>{gradient.quantity} {gradient.unit}</td>
                            <td>{gradient.purpose}</td>
                            <td>{gradient.storeKeeperName}</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center text-muted">No gradients applied</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card shadow-lg">
            <div className="card-header bg-gradient text-white">
              <h5><i className="bi bi-plus-circle me-2"></i>Add Inventory</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleAddInventory}>
                <div className="mb-3">
                  <label className="form-label">Fruit Type</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.fruitType}
                    onChange={e => handleFormChange({ ...form, fruitType: e.target.value })}
                    list="fruits"
                    required
                  />
                  <datalist id="fruits">
                    <option value="Sweet banana" />
                    <option value="Kampala" />
                    <option value="Cavendish" />
                    <option value="Plantain" />
                    <option value="Matoke" />
                    <option value="American sweet potatoes" />
                    <option value="White sweet potatoes" />
                    <option value="Red sweet potatoes" />
                    <option value="Local Avocados" />
                    <option value="Hass Avocados" />
                    <option value="Oranges" />
                    <option value="Pixie" />
                    <option value="Lemons" />
                  </datalist>
                </div>
                <div className="mb-3">
                  <label className="form-label">Quantity</label>
                  <input type="text" className="form-control" value={form.quantity} onChange={e => handleFormChange({ ...form, quantity: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Unit</label>
                  <select className="form-select" value={form.unit} onChange={e => handleFormChange({ ...form, unit: e.target.value })} required>
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                    <option value="pieces">pieces</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Location</label>
                  <input type="text" className="form-control" value={form.location} onChange={e => handleFormChange({ ...form, location: e.target.value })} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Expiry Date</label>
                  <input type="date" className="form-control" value={form.expiryDate} onChange={e => handleFormChange({ ...form, expiryDate: e.target.value })} required />
                </div>
                <button type="submit" className="btn btn-success" disabled={adding}>
                  {adding ? <span className="spinner-border spinner-border-sm me-2" role="status"></span> : <i className="bi bi-plus-circle me-2"></i>}
                  Add to Inventory
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryTab;