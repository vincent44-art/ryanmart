import React, { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Plus } from 'lucide-react';
import api, { safeApiCall } from '../services/api';

// =====================================================================
// API FUNCTIONS - Use safeApiCall for error handling
// =====================================================================

/**
 * Fetch car expenses with safe error handling
 * Returns: { success: boolean, data?: array, error?: string }
 */
const fetchCarExpenses = async () => {
  const result = await safeApiCall(() => 
    api.get('/car-expenses', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
      }
    })
  );
  
  if (result.success) {
    // Backend returns: { success: true, data: [...], message: "..." }
    const expenses = result.data?.data || [];
    return { success: true, data: Array.isArray(expenses) ? expenses : [] };
  }
  
  console.error('Failed to fetch car expenses:', result.error);
  return { success: false, error: result.error, data: [] };
};

/**
 * Create a new car expense
 */
const createCarExpense = async (expenseData) => {
  const token = localStorage.getItem('access_token');
  const result = await safeApiCall(() =>
    api.post('/car-expenses', expenseData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      }
    })
  );
  
  if (result.success) {
    return { success: true, data: result.data?.data };
  }
  
  console.error('Failed to create car expense:', result.error);
  return { success: false, error: result.error };
};

/**
 * Delete a car expense
 */
const deleteCarExpense = async (id) => {
  const token = localStorage.getItem('access_token');
  const result = await safeApiCall(() =>
    api.delete(`/car-expenses/${id}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
  );
  
  if (!result.success) {
    console.error('Failed to delete car expense:', result.error);
  }
  
  return result;
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================

const CarExpensesTab = (props) => {
  // Accept data prop for dashboard integration, fallback to fetching if not provided
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    driverEmail: '',
    carType: '',
    type: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Load expenses - either from props or fetch from API
  const loadExpenses = useCallback(async () => {
    // If data is passed as prop, use it
    if (Array.isArray(props.data)) {
      setExpenses(props.data);
      setLoading(false);
      return;
    }
    
    // Otherwise fetch from API
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchCarExpenses();
      if (result.success) {
        setExpenses(result.data);
      } else {
        setError(result.error || 'Failed to load expenses');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [props.data]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this car expense?')) {
      return;
    }

    try {
      const result = await deleteCarExpense(id);
      if (result.success) {
        setExpenses(expenses.filter(exp => exp.id !== id));
      } else {
        alert('Failed to delete expense: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error deleting expense: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newExpense = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    try {
      const result = await createCarExpense(newExpense);
      
      if (result.success && result.data) {
        setExpenses([...expenses, result.data]);
        
        // Reset form
        setFormData({
          driverEmail: '',
          carType: '',
          type: '',
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0]
        });
        setShowForm(false);
      } else {
        alert('Failed to create expense: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error creating expense: ' + err.message);
    }
  };

  const clearAllExpenses = async () => {
    if (!window.confirm('Are you sure you want to clear all car expenses? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete each expense one by one
      const deletePromises = expenses.map(exp => deleteCarExpense(exp.id));
      const results = await Promise.all(deletePromises);
      
      // Check if all were successful
      const allSuccessful = results.every(r => r.success);
      
      if (allSuccessful) {
        setExpenses([]);
      } else {
        const failed = results.filter(r => !r.success).length;
        alert(`Deleted ${results.length - failed}/${results.length} expenses. Some deletions may have failed.`);
        // Refresh the list
        loadExpenses();
      }
    } catch (err) {
      alert('Error clearing expenses: ' + err.message);
    }
  };

  // Always work with an array for filtering
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const filteredExpenses = safeExpenses.filter(exp =>
    exp.driverEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exp.carType && exp.carType.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // =====================================================================
  // RENDER
  // =====================================================================

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading car expenses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h5 className="alert-heading">Error Loading Data</h5>
        <p>{error}</p>
        <hr />
        <button className="btn btn-outline-danger" onClick={loadExpenses}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Car Expenses</h2>
        <div>
          <button className="btn btn-gradient me-2" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="me-1" /> Add Expense
          </button>
          <button
            className="btn btn-outline-danger"
            onClick={clearAllExpenses}
            disabled={expenses.length === 0}
          >
            <Trash2 size={16} className="me-1" /> Clear All
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card card-custom mb-4">
          <div className="card-body">
            <h5 className="card-title text-gradient">Record New Car Expense</h5>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Driver Email</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={formData.driverEmail}
                    onChange={(e) => setFormData({ ...formData, driverEmail: e.target.value })} 
                    required 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Car Type</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.carType}
                    onChange={(e) => setFormData({ ...formData, carType: e.target.value })} 
                    required 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Expense Type</label>
                  <select 
                    className="form-control" 
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })} 
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="fuel">Fuel</option>
                    <option value="repair">Repair</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Amount (KES)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    className="form-control" 
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })} 
                    required 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-control" 
                    rows="2" 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    required 
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
                    required 
                  />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-gradient">Record Expense</button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card card-custom mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="position-relative flex-grow-1">
              <Search className="position-absolute" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#6c757d' }} />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search car expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card card-custom">
        <div className="card-body">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">
                {expenses.length === 0 
                  ? 'No car expenses found. Add your first expense above.' 
                  : 'No matching expenses found.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Car Name</th>
                    <th>Car Number Plate</th>
                    <th>Stock Name</th>
                    <th>Amount (KES)</th>
                    <th>Date</th>
                    <th>Driver</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td>{exp.type}</td>
                      <td>{exp.description || '-'}</td>
                      <td>{exp.car_name || exp.carType || '-'}</td>
                      <td>{exp.car_number_plate || '-'}</td>
                      <td>{exp.stock_name || '-'}</td>
                      <td>{formatCurrency(exp.amount)}</td>
                      <td>{exp.date ? new Date(exp.date).toLocaleDateString() : '-'}</td>
                      <td>{exp.driver_email || exp.driverEmail || '-'}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          onClick={() => handleDelete(exp.id)}
                          title="Delete expense"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarExpensesTab;

