// src/pages/PurchaserDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
// CeoMessagesDisplay removed
import {
  fetchPurchases,
  addPurchase,
  clearPurchases
} from '../api/purchase'; // ✅ Fixed import
import { fetchOtherExpenses } from '../api/otherExpenses';
import OtherExpenseForm from '../components/OtherExpenseForm';
import OtherExpensesTable from '../components/OtherExpensesTable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const PurchaserDashboard = () => {
  const { user, logout } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    employeeName: user?.name || '',
    fruitType: '',
    quantity: '',
    unit: 'kg',
    buyerName: '', // changed from farmerName
    amountPerKg: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Calculate total amount when quantity or pricePerUnit changes
  useEffect(() => {
    if (formData.quantity && formData.amountPerKg) {
      const quantity = parseFloat(formData.quantity);
      const amountPerKg = parseFloat(formData.amountPerKg);
      if (!isNaN(quantity) && !isNaN(amountPerKg)) {
        const totalAmount = quantity * amountPerKg;
        setFormData(prev => ({
          ...prev,
          amount: totalAmount.toFixed(2)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        amount: ''
      }));
    }
  }, [formData.quantity, formData.amountPerKg]);

  // Helper function to check if response is HTML
  const isHtmlResponse = (text) => {
    if (typeof text !== 'string') return false;
    const trimmed = text.trim().toLowerCase();
    return trimmed.startsWith('<!doctype') || 
           trimmed.startsWith('<html') || 
           trimmed.startsWith('<!html');
  };

  // Fetch purchases and other expenses on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch purchases with raw response handling
        const purchasesResponse = await fetchPurchases(user.email);
        
        // Check if response is HTML (server error page)
        if (purchasesResponse && typeof purchasesResponse === 'string' && isHtmlResponse(purchasesResponse)) {
          console.error('Server returned HTML error page instead of JSON');
          setError('Server error. Please check your connection and try again. If the problem persists, contact support.');
          setPurchases([]);
        } else {
          // Handle normal JSON response
          let purchasesData = purchasesResponse?.data;
          
          // Check if the response is valid JSON (not HTML)
          if (purchasesResponse && typeof purchasesResponse === 'object' && !Array.isArray(purchasesData) && purchasesData?.success !== undefined) {
            // API returned a valid JSON response
            if (Array.isArray(purchasesData?.data)) {
              setPurchases(purchasesData.data);
            } else if (purchasesData?.items && Array.isArray(purchasesData.items)) {
              setPurchases(purchasesData.items);
            } else {
              setPurchases([]);
            }
          } else if (Array.isArray(purchasesData)) {
            // Direct array response
            setPurchases(purchasesData);
          } else {
            console.warn('Unexpected purchases response format:', purchasesResponse);
            setPurchases([]);
          }
        }
        
        // Fetch other expenses
        try {
          const otherExpensesResponse = await fetchOtherExpenses();
          if (otherExpensesResponse && typeof otherExpensesResponse === 'object') {
            const expensesData = otherExpensesResponse?.data;
            if (Array.isArray(expensesData)) {
              setOtherExpenses(expensesData);
            } else if (expensesData?.items && Array.isArray(expensesData.items)) {
              setOtherExpenses(expensesData.items);
            } else {
              setOtherExpenses([]);
            }
          } else {
            setOtherExpenses([]);
          }
        } catch (expenseErr) {
          console.warn('Failed to load other expenses:', expenseErr);
          setOtherExpenses([]);
        }
      } catch (err) {
        // Handle JSON parsing errors (when API returns HTML)
        if (err instanceof SyntaxError && err.message.includes('Unexpected token')) {
          setError('Failed to load data. The server may be returning an error page. Please check your connection and try again.');
        } else if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          // Optionally trigger logout
          if (logout) logout();
        } else if (err.response?.status === 403) {
          setError('You are not authorized to view this data.');
        } else if (err.response?.status >= 500) {
          setError('Server error. Please try again later. If the problem persists, contact support.');
        } else {
          setError('Failed to load data. Please try again later.');
        }
        console.error('Error loading data:', err);
        // Reset data on error
        setPurchases([]);
        setOtherExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      loadData();
    }
  }, [user?.email]);

  const handleOtherExpenseAdded = (newExpense) => {
    setOtherExpenses(prev => [newExpense, ...prev]);
  };

  const handleOtherExpenseDeleted = (deletedId) => {
    setOtherExpenses(prev => prev.filter(expense => expense.id !== deletedId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const newPurchase = {
        ...formData,
        purchaserEmail: user.email,
        quantity: formData.quantity, // Keep as string
        amount: parseFloat(formData.amount),
        amountPerKg: parseFloat(formData.amountPerKg)
      };
      const response = await addPurchase(newPurchase);
      setPurchases(prev => [...prev, response.data]);
      setFormData({
        employeeName: user?.name || '',
        fruitType: '',
        quantity: '',
        unit: 'kg',
        buyerName: '', // changed from farmerName
        amountPerKg: '',
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      setError('Failed to add purchase. Please try again.');
      console.error('Error adding purchase:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearPurchases = async () => {
    if (window.confirm('Are you sure you want to clear all your purchases? This cannot be undone.')) {
      try {
        setLoading(true);
        await clearPurchases(user.email);
        setPurchases([]);
      } catch (err) {
        setError('Failed to clear purchases. Please try again.');
        console.error('Error clearing purchases:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Format currency function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  // Group purchases by date
  const groupedPurchases = (purchases || []).reduce((acc, purchase) => {
    const date = purchase.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(purchase);
    return acc;
  }, {});
  const filteredGroupedPurchases = Object.entries(groupedPurchases).filter(([date, items]) =>
    items.some(purchase =>
      (purchase.fruitType ? purchase.fruitType.toLowerCase() : '').includes(search.toLowerCase()) ||
      (purchase.buyerName ? purchase.buyerName.toLowerCase() : '').includes(search.toLowerCase())
    )
  );

  // PDF download for a specific date
  const downloadPDF = (date, items) => {
    const doc = new jsPDF();
    doc.text(`Purchases Report for ${new Date(date).toLocaleDateString()}`, 10, 10);
    autoTable(doc, {
      head: [["#", "Fruit", "Quantity", "Unit", "Farmer", "Amount per KG", "Total Amount"]],
      body: items.map((purchase, idx) => [
        idx + 1,
        purchase.fruitType,
        purchase.quantity,
        purchase.unit,
        purchase.buyerName,
        formatCurrency(purchase.amountPerKg),
        formatCurrency(purchase.amount)
      ]),
      startY: 20
    });
    doc.save(`purchases_${date}.pdf`);
  };

  return (
    <div className="container py-4">
      <div className="mb-3">
        <h5>Welcome, {user?.name} ({user?.email})</h5>
      </div>
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-outline-danger" onClick={logout}>
          <i className="bi bi-box-arrow-right me-1"></i>Logout
        </button>
      </div>
      {error && (
        <div className="alert alert-danger mb-3">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}
      
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="bi bi-cart-plus me-2"></i>
                Record Purchase
              </h4>
            </div>
            <div className="card-body">
              {/* CeoMessagesDisplay removed */}
              
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Employee Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="employeeName"
                      value={formData.employeeName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Fruit Type</label>
                    <input
                      type="text"
                      className="form-control"
                      name="fruitType"
                      value={formData.fruitType}
                      onChange={handleChange}
                      list="fruits"
                      required
                      disabled={loading}
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
                </div>
                
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Quantity</label>
                    <input
                      type="text"
                      className="form-control"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-2 mb-3">
                    <label className="form-label">Unit</label>
                    <select
                      className="form-select"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                      <option value="pieces">pieces</option>
                    </select>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Farmer Name</label>
                    <input
                      type="text"
                      className="form-control"
                      name="buyerName" // changed from farmerName
                      value={formData.buyerName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Amount per KG</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="amountPerKg"
                      value={formData.amountPerKg}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Total Amount (KES)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      required
                      disabled
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary"
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
                      Record Purchase
                    </>
                  )}
                </button>
              </form>
              {/* Other Expenses Form */}
              <OtherExpenseForm onExpenseAdded={handleOtherExpenseAdded} />
              <OtherExpensesTable expenses={otherExpenses} onExpenseDeleted={handleOtherExpenseDeleted} />
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">My Purchases</h5>
              <button 
                className="btn btn-outline-light btn-sm"
                onClick={handleClearPurchases}
                disabled={loading || purchases.length === 0}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-trash me-1"></i>
                )}
                Clear All
              </button>
            </div>
            <div className="card-body">
              <div className="mb-3 d-flex justify-content-between align-items-center">
                <input
                  type="text"
                  className="form-control w-50"
                  placeholder="Search by fruit or farmer..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="table-responsive" style={{maxHeight: '400px', overflowY: 'auto'}}>
                <table className="table table-hover align-middle border rounded shadow-sm">
                  <thead className="table-primary sticky-top">
                    <tr>
                      <th>#</th>
                      <th>Date</th>
                      <th>Fruit</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Farmer</th>
                      <th>Amount per KG</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroupedPurchases.length === 0 && !loading ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted">No purchases recorded yet</td>
                      </tr>
                    ) : (
                      filteredGroupedPurchases.flatMap(([date, items], groupIdx) => {
                        const rows = [];
                        if (groupIdx !== 0) {
                          rows.push(
                            <tr key={`spacer-${date}`}> <td colSpan="8" style={{background:'#f8f9fa'}}></td> </tr>
                          );
                        }
                        rows.push(
                          <tr key={`date-${date}`}> <td colSpan="8" className="bg-light fw-bold">
                            {new Date(date).toLocaleDateString()} <button className="btn btn-sm btn-outline-primary ms-2" onClick={() => downloadPDF(date, items)}>Download PDF</button>
                          </td></tr>
                        );
                        rows.push(...items
                          .filter(purchase =>
                            (purchase.fruitType ? purchase.fruitType.toLowerCase() : '').includes(search.toLowerCase()) ||
                            (purchase.buyerName ? purchase.buyerName.toLowerCase() : '').includes(search.toLowerCase())
                          )
                          .map((purchase, idx) => (
                            <tr key={purchase.id || purchase._id} className="bg-light">
                              <td className="fw-bold text-secondary">{idx + 1}</td>
                              <td>{new Date(purchase.date).toLocaleDateString()}</td>
                              <td>{purchase.fruitType}</td>
                              <td>{purchase.quantity}</td>
                              <td>{purchase.unit}</td>
                              <td>{purchase.buyerName}</td>
                              <td>{formatCurrency(purchase.amountPerKg)}</td>
                              <td className="fw-bold text-success">{formatCurrency(purchase.amount)}</td>
                            </tr>
                          ))
                        );
                        return rows;
                      })
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

export default PurchaserDashboard;