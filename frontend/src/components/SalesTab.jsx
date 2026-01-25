import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

// Use relative paths for all API calls — backend determined by REACT_APP_API_BASE_URL env var
// IMPORTANT: Ensure BASE_URL includes /api suffix since backend routes are prefixed with /api
const BASE_URL = process.env.REACT_APP_API_BASE_URL 
  ? `${process.env.REACT_APP_API_BASE_URL}/api` 
  : 'https://ryanmart-bacckend.onrender.com/api';

const formatKenyanCurrency = (amount) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount || 0);

const SalesTab = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSales = async () => {
      try {
        const res = await fetch(`${BASE_URL}/sales`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        // Check if response is ok before parsing
        if (!res.ok) {
          console.error('Failed to load sales data:', res.status, res.statusText);
          setSales([]);
          return;
        }

        // Get response as text first to check if it's HTML
        const text = await res.text();
        if (text.trim().startsWith('<!doctype') || text.trim().startsWith('<html')) {
          console.error('Received HTML error page instead of JSON:', text.substring(0, 200));
          setSales([]);
          return;
        }

        // Parse as JSON
        const body = JSON.parse(text);
        // Extract sales from body.data.sales, fallback to []
        setSales(Array.isArray(body?.data?.sales) ? body.data.sales : []);
      } catch (error) {
        console.error('Error loading sales data:', error);
        setSales([]);
      } finally {
        setLoading(false);
      }
    };
    loadSales();
  }, []);

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  // Group sales by date
  const salesByDate = sales.reduce((acc, sale) => {
    const date = sale.date || 'Unknown Date';
    if (!acc[date]) acc[date] = [];
    acc[date].push(sale);
    return acc;
  }, {});

  const sortedDates = Object.keys(salesByDate).sort((a, b) => new Date(b) - new Date(a));

  // PDF download handler
  const downloadDailySalesReport = async (dateStr) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`/api/sales/report/${dateStr}`, {
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
        a.download = `sales_report_${dateStr}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Failed to download sales report');
      }
    } catch (error) {
      console.error('Error downloading sales report:', error);
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="card card-custom">
        <div className="card-body p-0">
          {sales.length > 0 ? (
            <div className="table-responsive">
              {sortedDates.map((date, index) => {
                const daySales = salesByDate[date];
                const totalAmount = daySales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
                const totalQuantity = daySales.reduce((sum, sale) => sum + parseFloat(sale.qty || 0), 0);
                return (
                  <div key={date}>
                    {/* Black column separator */}
                    {index > 0 && <div style={{height: '2px', backgroundColor: 'black', margin: '20px 0'}}></div>}

                    {/* Day header with summary and PDF download */}
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
                            {daySales.length} sale{daySales.length !== 1 ? 's' : ''} |
                            Total: {formatKenyanCurrency(totalAmount)} |
                            Qty: {totalQuantity.toFixed(2)}
                          </small>
                        </div>
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => downloadDailySalesReport(date)}
                          title="Download PDF Report"
                        >
                          <Download size={16} className="me-1" />
                          PDF
                        </button>
                      </div>
                    </div>

                    {/* Sales table for this day */}
                    <div className="table-responsive mb-4">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Stock Name</th>
                            <th>Fruit Name</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Amount</th>
                            <th>Customer Name</th>
                            <th>Seller Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {daySales.map(sale => (
                            <tr key={sale.id}>
                              <td>{sale.stock_name}</td>
                              <td>{sale.fruit_name}</td>
                              <td>{sale.qty}</td>
                              <td>{formatKenyanCurrency(sale.unit_price)}</td>
                              <td className="fw-bold">{formatKenyanCurrency(sale.amount)}</td>
                              <td>{sale.customer_name || 'N/A'}</td>
                              <td>{sale.seller_email || 'N/A'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4">
              No sales records found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesTab;
