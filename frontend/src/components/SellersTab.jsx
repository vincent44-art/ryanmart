import React, { useState, useEffect } from 'react';
import { fetchSellerFruits } from '../api/sellerFruits';

const SellersTab = () => {
  const [sellerFruits, setSellerFruits] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchTerm = '';

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        if (!token) {
          setSellerFruits([]);
          setLoading(false);
          return;
        }
        const fruitsRes = await fetchSellerFruits(token);
        // Handle response from /api/seller-fruits: array of fruits
        if (Array.isArray(fruitsRes)) {
          setSellerFruits(fruitsRes);
        } else {
          setSellerFruits([]);
        }
      } catch (error) {
        console.error('Failed to fetch seller fruits:', error);
        setSellerFruits([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  const filteredFruits = sellerFruits.filter(fruit =>
    (fruit.fruit_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fruit.stock_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fruit.creator_email || fruit.created_by || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group seller fruits by date
  const groupedSellerFruits = filteredFruits.reduce((groups, fruit) => {
    const date = fruit.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(fruit);
    return groups;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedSellerFruits).sort((a, b) => new Date(b) - new Date(a));

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
    <div className="card card-custom">
      <div className="card-body p-0">
        {sortedDates.length > 0 ? (
          sortedDates.map((date, index) => {
            const dayFruits = groupedSellerFruits[date];
            const totalAmount = dayFruits.reduce((sum, fruit) => sum + (fruit.amount || 0), 0);
            const totalQuantity = dayFruits.reduce((sum, fruit) => sum + parseFloat(fruit.qty || 0), 0);
            return (
              <div key={date}>
                {index > 0 && <div style={{height: '2px', backgroundColor: 'black', margin: '20px 0'}}></div>}
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
                        {dayFruits.length} record{dayFruits.length !== 1 ? 's' : ''} |
                        Total: {formatCurrency(totalAmount)} |
                        Qty: {totalQuantity.toFixed(2)}
                      </small>
                    </div>
                  </div>
                </div>
                <div className="table-responsive mb-4">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Stock Name</th>
                        <th>Fruit Name</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Created At</th>
                        <th>Created By</th>
                        <th>Creator Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayFruits.map(fruit => (
                        <tr key={fruit.id}>
                          <td>{fruit.id}</td>
                          <td>{fruit.stock_name}</td>
                          <td>{fruit.fruit_name}</td>
                          <td>{fruit.qty}</td>
                          <td>{formatCurrency(fruit.unit_price)}</td>
                          <td>{formatDate(fruit.date)}</td>
                          <td className="fw-bold">{formatCurrency(fruit.amount)}</td>
                          <td>{formatDate(fruit.created_at)}</td>
                          <td>{fruit.created_by}</td>
                          <td>{fruit.creator_email || 'N/A'}</td>
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
            {sellerFruits.length === 0
              ? 'No seller fruits records found'
              : 'No matching records found'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellersTab;
