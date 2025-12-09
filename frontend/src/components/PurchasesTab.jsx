import React, { useState, useEffect } from 'react';
import { Search, Trash2, Plus, Download } from 'lucide-react';
import { fetchPurchases, deletePurchase } from '../api/purchase';
// import { deletePurchase } from './apiHelpers'; // If needed, implement deletePurchase in ../api/purchase.js

import PurchaseFormModal from './PurchaseFormModal';

const PurchasesTab = (props) => {
  // Accept data prop for dashboard integration, fallback to fetching if not provided
  const [purchases, setPurchases] = useState(Array.isArray(props.data) ? props.data : []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch purchases from API
  useEffect(() => {
    // If data is passed as prop, use it, otherwise fetch all purchases from DB
    if (Array.isArray(props.data)) {
      setPurchases(props.data);
      setLoading(false);
    } else {
      const loadPurchases = async () => {
        try {
          // Fetch all purchases (no email filter)
          const response = await fetchPurchases();
          // Use paginated response: response.data.data.items
          setPurchases(Array.isArray(response.data?.data?.items) ? response.data.data.items : []);
        } catch (err) {
          console.error('Failed to fetch purchases:', err);
          setError('Failed to load purchases. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      loadPurchases();
    }
  }, [props.data]);

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

  const handleAddPurchase = (newPurchase) => {
    setPurchases([...purchases, newPurchase]);
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

  // Group purchases by date
  const groupedPurchases = filteredPurchases.reduce((groups, purchase) => {
    const date = purchase.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(purchase);
    return groups;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedPurchases).sort((a, b) => new Date(b) - new Date(a));

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
        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={18} className="me-2" />
          Add Purchase
        </button>
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
              placeholder="Search purchases by purchaser, employee, fruit type, or buyer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body p-0">
          {sortedDates.length > 0 ? (
            sortedDates.map((date, index) => {
              const dayPurchases = groupedPurchases[date];
              const totalAmount = dayPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
              const totalQuantity = dayPurchases.reduce((sum, purchase) => sum + parseFloat(purchase.quantity || 0), 0);

              return (
                <div key={date}>
                  {/* Black column separator */}
                  {index > 0 && <div style={{height: '2px', backgroundColor: 'black', margin: '20px 0'}}></div>}

                  {/* Day header with PDF download */}
                  <div className="d-flex justify-content-between align-items-center mb-3 px-3 pt-3">
                    <h4 className="mb-0">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h4>
                    <div className="d-flex align-items-center gap-3">
                      <div className="text-muted">
                        <small>
                          {dayPurchases.length} purchase{dayPurchases.length !== 1 ? 's' : ''} |
                          Total: {formatCurrency(totalAmount)} |
                          Qty: {totalQuantity.toFixed(2)}
                        </small>
                      </div>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => downloadDailyReport(date)}
                        title="Download PDF Report"
                      >
                        <Download size={16} className="me-1" />
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* Purchases table for this day */}
                  <div className="table-responsive mb-4">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Purchaser</th>
                          <th>Employee</th>
                          <th>Fruit Type</th>
                          <th>Quantity</th>
                          <th>Buyer</th>
                          <th>Amount</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dayPurchases.map(purchase => (
                          <tr key={purchase.id}>
                            <td>{purchase.purchaserEmail}</td>
                            <td>{purchase.employeeName}</td>
                            <td>
                              <span className="badge bg-success">
                                {purchase.fruitType}
                              </span>
                            </td>
                            <td>{purchase.quantity} {purchase.unit}</td>
                            <td>{purchase.buyerName}</td>
                            <td className="fw-bold">{formatCurrency(purchase.amount)}</td>
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
                </div>
              );
            })
          ) : (
            <div className="text-center py-4">
              {purchases.length === 0
                ? 'No purchase records found'
                : 'No matching purchases found'}
            </div>
          )}
        </div>
      </div>

      <PurchaseFormModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddPurchase={handleAddPurchase}
      />
    </div>
  );
};

export default PurchasesTab;
