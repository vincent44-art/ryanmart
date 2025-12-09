import React, { useState, useEffect } from 'react';
import { Search, Trash2, PlusCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
//import { fetchOtherExpenses, createOtherExpense, deleteOtherExpense } from 'http://127.0.0.1:5000/api';
import { fetchOtherExpenses, createOtherExpense, deleteOtherExpense } from './apiHelpers';


const OtherExpensesTab = ({ token }) => {
  const { token: authToken, user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    expense_type: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch expenses on component mount
  useEffect(() => {
    const loadExpenses = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetchOtherExpenses(authToken);
        // Support both axios and fetch API response shapes
        let expensesData = [];
        console.log('fetchOtherExpenses response:', response);
        if (Array.isArray(response)) {
          expensesData = response;
        } else if (Array.isArray(response?.data)) {
          expensesData = response.data;
        } else if (Array.isArray(response?.data?.data)) {
          expensesData = response.data.data;
        }
        console.log('Parsed expensesData:', expensesData);
        setExpenses(expensesData);
      } catch (err) {
        console.error('Failed to fetch expenses:', err);
        setError('Failed to load expenses. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadExpenses();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newExpense = {
        expense_type: formData.expense_type,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date
      };
      
      const response = await createOtherExpense(newExpense, authToken);
      // Support both axios and fetch API response shapes for create
      let createdExpense = response?.data?.data || response?.data;
      setExpenses(prev => [...prev, createdExpense]);
      
      // Reset form
      setFormData({
        expense_type: '',
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Failed to create expense:', err);
      setError('Failed to add expense. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      await deleteOtherExpense(id, authToken);
      setExpenses(expenses.filter(expense => expense.id !== id));
    } catch (err) {
      console.error('Failed to delete expense:', err);
      setError('Failed to delete expense. Please try again.');
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    (expense.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group expenses by date
  const expensesByDate = filteredExpenses.reduce((groups, expense) => {
    const date = expense.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(expense);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">Other Expenses Management</h2>
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      <div className="row">
        <div className="col-lg-4 mb-4 mb-lg-0">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Record New Expense</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Expense Type</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.expense_type}
                    onChange={(e) => setFormData({...formData, expense_type: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Amount (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">
                  <PlusCircle className="me-2" size={18} />
                  Add Expense
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="col-lg-8">
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search expenses by description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>User ID</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(expensesByDate).length > 0 ? (
                      Object.entries(expensesByDate).map(([date, dateExpenses]) => (
                        <React.Fragment key={date}>
                          {/* PDF Download Row for the Date */}
                          <tr className="table-info">
                            <td colSpan="6" className="text-center py-2">
                              <strong>{new Date(date).toLocaleDateString()}</strong>
                              <a
                                href={`/api/other-expenses/pdf?date=${encodeURIComponent(date)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-primary ms-3"
                              >
                                Download PDF for {new Date(date).toLocaleDateString()}
                              </a>
                            </td>
                          </tr>
                          {/* Individual Expense Rows */}
                          {dateExpenses.map(expense => (
                            <tr key={expense.id}>
                              <td>{new Date(expense.date).toLocaleDateString()}</td>
                              <td>{expense.expense_type}</td>
                              <td>{expense.description}</td>
                              <td className="fw-bold">{formatCurrency(expense.amount)}</td>
                              <td>{expense.user_id}</td>
                              <td>
                                {expense.id ? (
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDelete(expense.id)}
                                    title="Delete expense"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                ) : (
                                  <span className="text-muted">N/A</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))
                    ) : (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  {expenses.length === 0
                    ? 'No expenses recorded yet'
                    : 'No matching expenses found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherExpensesTab;