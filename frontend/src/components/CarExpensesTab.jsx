import React, { useState, useEffect } from 'react';
import { Search, Trash2, Plus } from 'lucide-react';

// Use relative API paths — backend determined by REACT_APP_API_BASE_URL env var
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://ryanmart.store/api';
const API_ENDPOINT = '/api/car-expenses';

// ✅ Define API functions
const fetchCarExpenses = async () => {
  const token = localStorage.getItem('access_token');
  const res = await fetch(API_ENDPOINT, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error('Failed to fetch car expenses');
  return await res.json();
};

const createCarExpense = async (expense) => {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE_URL}/car-expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(expense),
  });
  if (!res.ok) throw new Error('Failed to create expense');
  return await res.json();
};

const deleteCarExpense = async (id) => {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error('Failed to delete expense');
  return await res.json();
};

// ✅ Main component
const CarExpensesTab = (props) => {
  // Accept data prop for dashboard integration, fallback to fetching if not provided
  const [expenses, setExpenses] = useState(Array.isArray(props.data) ? props.data : []);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    // If data is passed as prop, use it, otherwise fetch
    if (Array.isArray(props.data)) {
      setExpenses(props.data);
      setLoading(false);
    } else {
      const loadExpenses = async () => {
        try {
          const response = await fetchCarExpenses();
          setExpenses(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
          console.error('Failed to fetch car expenses:', error);
        } finally {
          setLoading(false);
        }
      };
      loadExpenses();
    }
  }, [props.data]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this car expense?')) {
      try {
        await deleteCarExpense(id);
        setExpenses(expenses.filter(exp => exp.id !== id));
      } catch (error) {
        console.error('Failed to delete car expense:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newExpense = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      const response = await createCarExpense(newExpense);
      setExpenses([...expenses, response.data]);

      setFormData({
        driverEmail: '',
        carType: '',
        type: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create car expense:', error);
    }
  };

  const clearAllExpenses = async () => {
    if (window.confirm('Are you sure you want to clear all car expenses? This action cannot be undone.')) {
      try {
        await Promise.all(expenses.map(exp => deleteCarExpense(exp.id)));
        setExpenses([]);
      } catch (error) {
        console.error('Failed to clear car expenses:', error);
      }
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

  if (loading) return <div className="text-center py-5">Loading car expenses...</div>;

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
                  <input type="email" className="form-control" value={formData.driverEmail}
                    onChange={(e) => setFormData({ ...formData, driverEmail: e.target.value })} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Car Type</label>
                  <input type="text" className="form-control" value={formData.carType}
                    onChange={(e) => setFormData({ ...formData, carType: e.target.value })} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Expense Type</label>
                  <select className="form-control" value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })} required>
                    <option value="">Select Type</option>
                    <option value="fuel">Fuel</option>
                    <option value="repair">Repair</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Amount (KES)</label>
                  <input type="number" step="0.01" min="0" className="form-control" value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows="2" value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
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
                {filteredExpenses.length > 0 ? (
                  filteredExpenses.map(exp => (
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
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(exp.id)}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      {expenses.length === 0 ? 'No car expenses found' : 'No matching expenses found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarExpensesTab;
