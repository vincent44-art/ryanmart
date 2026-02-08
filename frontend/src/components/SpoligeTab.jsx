import React, { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, Plus, Edit2, X } from 'lucide-react';
import { fetchSpolige, createSpolige, updateSpolige, deleteSpolige, clearAllSpolige } from '../api/spolige';

const SpoligeTab = (props) => {
  const [spoligeRecords, setSpoligeRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    fruit_name: '',
    quantity: '',
    stage: 'partial',
    amount_per_kg: '',
    total_amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Common fruit types
  const fruitTypes = [
    'Mango',
    'Avocado',
    'Banana',
    'Apple',
    'Orange',
    'Lemon',
    'Pineapple',
    'Papaya',
    'Passion Fruit',
    'Grapes',
    'Watermelon',
    'Guava',
    'Peach',
    'Pear',
    'Plum',
    'Cherry',
    'Kiwi',
    'Dragon Fruit',
    'Other'
  ];

  // Spoilage stages
  const spoilageStages = [
    { value: 'fresh', label: 'Fresh' },
    { value: 'slight_damage', label: 'Slight Damage' },
    { value: 'partial', label: 'Partial Spoilage' },
    { value: 'mostly_spoiled', label: 'Mostly Spoiled' },
    { value: 'fully_spoiled', label: 'Fully Spoiled' }
  ];

  // Load spolige records
  const loadSpolige = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchSpolige();
      if (result.success) {
        // Ensure data is always an array
        const data = Array.isArray(result.data) ? result.data : [];
        setSpoligeRecords(data);
      } else {
        setError(result.error || 'Failed to load spolige records');
        setSpoligeRecords([]); // Set to empty array on error
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error loading spolige:', err);
      setSpoligeRecords([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpolige();
  }, [loadSpolige]);

  // Calculate total amount automatically when quantity or amount_per_kg changes
  useEffect(() => {
    const quantity = parseFloat(formData.quantity) || 0;
    const amountPerKg = parseFloat(formData.amount_per_kg) || 0;
    const total = quantity * amountPerKg;
    setFormData(prev => ({
      ...prev,
      total_amount: total.toFixed(2)
    }));
  }, [formData.quantity, formData.amount_per_kg]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  const getStageLabel = (stage) => {
    const stageObj = spoilageStages.find(s => s.value === stage);
    return stageObj ? stageObj.label : stage;
  };

  const getStageBadgeClass = (stage) => {
    switch (stage) {
      case 'fresh': return 'bg-success';
      case 'slight_damage': return 'bg-info';
      case 'partial': return 'bg-warning';
      case 'mostly_spoiled': return 'bg-orange';
      case 'fully_spoiled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const spoligeData = {
      fruit_name: formData.fruit_name,
      quantity: parseFloat(formData.quantity),
      stage: formData.stage,
      amount_per_kg: parseFloat(formData.amount_per_kg),
      total_amount: parseFloat(formData.total_amount),
      description: formData.description,
      date: formData.date
    };

    try {
      if (editingId) {
        // Update existing record
        const result = await updateSpolige(editingId, spoligeData);
        if (result.success) {
          setSpoligeRecords(prev => 
            prev.map(r => r.id === editingId ? { ...r, ...spoligeData } : r)
          );
          resetForm();
        } else {
          alert('Failed to update: ' + (result.error || 'Unknown error'));
        }
      } else {
        // Create new record
        const result = await createSpolige(spoligeData);
        if (result.success && result.data) {
          setSpoligeRecords(prev => [...prev, result.data]);
          resetForm();
        } else {
          alert('Failed to create: ' + (result.error || 'Unknown error'));
        }
      }
    } catch (err) {
      alert('Error saving spolige: ' + err.message);
    }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setFormData({
      fruit_name: record.fruit_name || '',
      quantity: record.quantity || '',
      stage: record.stage || 'partial',
      amount_per_kg: record.amount_per_kg || '',
      total_amount: record.total_amount || '',
      description: record.description || '',
      date: record.date ? record.date.split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this spolige record?')) {
      return;
    }

    try {
      const result = await deleteSpolige(id);
      if (result.success) {
        setSpoligeRecords(prev => prev.filter(r => r.id !== id));
      } else {
        alert('Failed to delete: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error deleting spolige: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear ALL spolige records? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await clearAllSpolige();
      if (result.success) {
        setSpoligeRecords([]);
        alert('All spolige records have been cleared.');
      } else {
        alert('Failed to clear: ' + (result.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Error clearing spolige: ' + err.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      fruit_name: '',
      quantity: '',
      stage: 'partial',
      amount_per_kg: '',
      total_amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Filter records based on search
  const filteredRecords = spoligeRecords.filter(record =>
    record.fruit_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.stage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (record.description && record.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate totals
  const totalQuantity = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0), 0);
  const totalAmount = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading spolige records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h5 className="alert-heading">Error Loading Data</h5>
        <p>{error}</p>
        <hr />
        <button className="btn btn-outline-danger" onClick={loadSpolige}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">Spoilage Tracker</h2>
          <small className="text-muted">Track fruit spoilage and losses</small>
        </div>
        <div>
          <button className="btn btn-gradient me-2" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="me-1" /> {showForm ? 'Cancel' : 'Add Spoilage'}
          </button>
          <button
            className="btn btn-outline-danger"
            onClick={handleClearAll}
            disabled={spoligeRecords.length === 0}
          >
            <Trash2 size={16} className="me-1" /> Clear All
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">Total Records</h5>
              <h2>{spoligeRecords.length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <h5 className="card-title">Total Quantity (KG)</h5>
              <h2>{totalQuantity.toFixed(2)}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card bg-danger text-white">
            <div className="card-body">
              <h5 className="card-title">Total Loss Amount</h5>
              <h2>{formatCurrency(totalAmount)}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card card-custom mb-4">
          <div className="card-body">
            <h5 className="card-title text-gradient">
              {editingId ? 'Edit Spoilage Record' : 'Record New Spoilage'}
            </h5>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Fruit Name</label>
                  <select
                    className="form-control"
                    value={formData.fruit_name}
                    onChange={(e) => setFormData({ ...formData, fruit_name: e.target.value })}
                    required
                  >
                    <option value="">Select Fruit</option>
                    {fruitTypes.map(fruit => (
                      <option key={fruit} value={fruit}>{fruit}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Quantity (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    placeholder="Enter quantity in KG"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Stage of Spoilage</label>
                  <select
                    className="form-control"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                    required
                  >
                    {spoilageStages.map(stage => (
                      <option key={stage.value} value={stage.value}>{stage.label}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Amount per KG (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    placeholder="Enter amount per KG"
                    value={formData.amount_per_kg}
                    onChange={(e) => setFormData({ ...formData, amount_per_kg: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Total Amount (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    placeholder="Auto-calculated"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    required
                    readOnly
                  />
                  <small className="text-muted">Auto-calculated from quantity × amount per KG</small>
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
                <div className="col-md-12 mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Additional notes about the spoilage"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-gradient">
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                  Cancel
                </button>
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
                placeholder="Search by fruit name, stage, or description..."
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
          {filteredRecords.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">
                {spoligeRecords.length === 0
                  ? 'No spoilage records found. Add your first record above.'
                  : 'No matching records found.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Fruit Name</th>
                    <th>Quantity (KG)</th>
                    <th>Stage</th>
                    <th>Amount per KG</th>
                    <th>Total Amount</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(record => (
                    <tr key={record.id}>
                      <td>{formatDate(record.date)}</td>
                      <td><strong>{record.fruit_name}</strong></td>
                      <td>{parseFloat(record.quantity).toFixed(2)}</td>
                      <td>
                        <span className={`badge ${getStageBadgeClass(record.stage)}`}>
                          {getStageLabel(record.stage)}
                        </span>
                        {record.source === 'automatic' && (
                          <span className="badge bg-info ms-1">Auto</span>
                        )}
                      </td>
                      <td>{formatCurrency(record.amount_per_kg)}</td>
                      <td className="text-danger fw-bold">{formatCurrency(record.total_amount)}</td>
                      <td>{record.description || '-'}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEdit(record)}
                            title="Edit record"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(record.id)}
                            title="Delete record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan="2" className="fw-bold">Totals:</td>
                    <td className="fw-bold">{totalQuantity.toFixed(2)}</td>
                    <td colSpan="3"></td>
                    <td className="fw-bold text-danger">{formatCurrency(totalAmount)}</td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpoligeTab;

