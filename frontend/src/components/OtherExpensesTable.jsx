import React, { useState } from 'react';
import { deleteOtherExpense } from '../api/otherExpenses';

const OtherExpensesTable = ({ expenses, onExpenseDeleted }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      setDeletingId(expenseId);
      setError(null);
      await deleteOtherExpense(expenseId);
      if (onExpenseDeleted) {
        onExpenseDeleted(expenseId);
      }
    } catch (err) {
      setError('Failed to delete expense. Please try again.');
      console.error('Error deleting expense:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-info text-white">
        <h5 className="mb-0">
          <i className="bi bi-table me-2"></i>
          Other Expenses
        </h5>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger mb-3">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {expenses.length === 0 ? (
          <div className="text-muted text-center py-4">
            <i className="bi bi-info-circle me-2"></i>
            No other expenses recorded yet.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>
                      <div>
                        <span className="fw-bold">{expense.description || 'N/A'}</span>
                        {expense.expense_type && (
                          <div>
                            <small className="text-muted">
                              Type: {expense.expense_type}
                            </small>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="fw-bold text-success">
                      {formatAmount(expense.amount)}
                    </td>
                    <td>{formatDate(expense.date)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(expense.id)}
                        disabled={deletingId === expense.id}
                      >
                        {deletingId === expense.id ? (
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                        ) : (
                          <i className="bi bi-trash"></i>
                        )}
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
  );
};

export default OtherExpensesTable;
