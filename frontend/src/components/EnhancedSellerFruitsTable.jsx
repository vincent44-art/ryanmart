import React, { useEffect, useState } from 'react';

// Use relative API paths — backend determined by REACT_APP_API_BASE_URL env var

const formatKenyanCurrency = (amount) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount || 0);

const EnhancedSellerFruitsTable = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSales = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('/api/sales', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const body = await res.json();
        // Handle paginated response
        if (body?.data?.items && Array.isArray(body.data.items)) {
          setSales(body.data.items);
        } else if (Array.isArray(body?.data)) {
          setSales(body.data);
        } else {
          setSales([]);
        }
      } catch {
        setSales([]);
      } finally {
        setLoading(false);
      }
    };
    loadSales();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="table-responsive">
      <table className="table table-hover mb-0">
        <thead className="table-light">
          <tr>
            <th>Stock Name</th>
            <th>Fruit Name</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Amount</th>
            <th>Creator Email</th>
          </tr>
        </thead>
        <tbody>
          {sales.length > 0 ? (
            sales.map(sale => (
              <tr key={sale.id}>
                <td>{sale.seller_fruit_name || sale.stock_name || sale.stockName}</td>
                <td>{sale.fruit_type || sale.fruit_name || sale.fruitType}</td>
                <td>{sale.quantity}</td>
                <td>{formatKenyanCurrency(sale.unit_price)}</td>
                <td className="fw-bold">{formatKenyanCurrency(sale.revenue || sale.amount)}</td>
                <td>{sale.seller_email || sale.creator_email || 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="text-center py-4">
                No sales records found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EnhancedSellerFruitsTable;
