import React, { useState } from 'react';

const OtherExpenseForm = ({ onExpenseAdded }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/other_expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          expense_type: 'Other',
          description: formData.description,
          amount: parseFloat(formData.amount),
          date: formData.date
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add expense');
      }

      const result = await response.json();

      if (result.success) {
        setFormData({
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0]
        });
        if (onExpenseAdded) {
          onExpenseAdded(result.data);
        }
      } else {
        setError(result.message || 'Failed to add expense');
      }
    } catch (err) {
      setError('Failed to add expense. Please try again.');
      console.error('Error adding expense:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">
          <i className="bi bi-cash me-2"></i>
          Record Other Expense
        </h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-control"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter expense description"
                required
                disabled={loading}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Amount (KES)</label>
              <input
                type="number"
                step="0.01"
                className="form-control"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                min="0"
                required
                disabled={loading}
              />
            </div>
            <div className="col-md-3 mb-3">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-info"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-plus-circle me-2"></i>
                Record Expense
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OtherExpenseForm;
