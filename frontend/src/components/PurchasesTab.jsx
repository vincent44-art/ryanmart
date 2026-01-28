import React, { useState, useEffect } from 'react';
import { Search, Trash2, Download } from 'lucide-react';
import { fetchPurchases, deletePurchase } from '../api/purchase';
import { useAuth } from '../contexts/AuthContext';

const PurchasesTab = (props) => {
  const { user } = useAuth();
  // Accept data prop for dashboard integration, fallback to fetching if not provided
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch purchases from API - syncs with PurchaserDashboard data
  const loadPurchases = async () => {
    try {
      setLoading(true);
      // Fetch all purchases (no email filter) to match PurchaserDashboard data
      const response = await fetchPurchases();
      // Use paginated response: response.data.data.items
      const purchasesData = Array.isArray(response.data?.data?.items) ? response.data.data.items : 
                           Array.isArray(response.data?.data) ? response.data.data : 
                           Array.isArray(response.data) ? response.data : [];
      setPurchases(purchasesData);
      // Also update the parent dashboard data if onUpdateData is provided
      if (props.onUpdateData) {
        props.onUpdateData(purchasesData);
      }
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
      setError('Failed to load purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch purchases on mount or when triggered
  useEffect(() => {
    // If data is passed as prop, use it, but still fetch fresh data from API to sync with PurchaserDashboard
    if (Array.isArray(props.data) && props.data.length > 0 && !props.forceRefresh) {
      setPurchases(props.data);
      setLoading(false);
    } else {
      loadPurchases();
    }
  }, [props.data, props.forceRefresh]);

  // Listen for purchase updates from other components
  useEffect(() => {
    const handlePurchaseUpdate = (event) => {
      if (event.detail?.refresh) {
        loadPurchases();
      }
    };
    window.addEventListener('purchase-update', handlePurchaseUpdate);
    return () => window.removeEventListener('purchase-update', handlePurchaseUpdate);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase?')) return;

    try {
      await deletePurchase(id);
      setPurchases(purchases.filter(purchase => purchase.id !== id));
    } catch (err) {
      console.error('Failed to delete purchase:', err);
      setError('Failed to delete purchase. Please try again.');
    }
  };

  const downloadDailyReport = async (dateStr) => {
    try {
      // Use the correct token key and backend URL
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/purchases/report/${dateStr}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `purchases_report_${dateStr}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  // Always work with an array for filtering
  const safePurchases = Array.isArray(purchases) ? purchases : [];
  const filteredPurchases = safePurchases.filter(purchase =>
    purchase.purchaserEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.fruitType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    purchase.buyerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort purchases by date in descending order (most recent first)
  const sortedPurchases = [...filteredPurchases].sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Purchase Management</h2>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          />
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text bg-transparent">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search purchases by purchaser, fruit type, farmer, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {sortedPurchases.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Purchaser</th>
                    <th>Fruit</th>
                    <th>Quantity</th>
                    <th>Unit</th>
                    <th>Farmer</th>
                    <th>Amount per KG</th>
                    <th>Total Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPurchases.map(purchase => (
                    <tr key={purchase.id}>
                      <td>{new Date(purchase.date).toLocaleDateString()}</td>
                      <td>{purchase.purchaserEmail}</td>
                      <td>{purchase.fruitType}</td>
                      <td>{purchase.quantity}</td>
                      <td>{purchase.unit}</td>
                      <td>{purchase.buyerName}</td>
                      <td>{formatCurrency(purchase.amountPerKg)}</td>
                      <td className="fw-bold text-success">{formatCurrency(purchase.amount)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(purchase.id)}
                          title="Delete purchase"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              {purchases.length === 0
                ? 'No purchase records found'
                : 'No matching purchases found'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchasesTab;

