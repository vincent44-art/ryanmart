import React, { useState, useEffect } from 'react';
import { Search, Trash2, Plus, Download } from 'lucide-react';
//import { fetchSales, createSale, deleteSale } from 'http://127.0.0.1:5000'; // Import your API functions
import { fetchSales, createAssignment, createSaleForAssignment, deleteSale } from './apiHelpers';


const SalesTab = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    sellerName: '',
    fruitType: '',
    quantitySold: '',
    revenue: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch sales data from backend
  useEffect(() => {
    const loadSales = async () => {
      try {
        const response = await fetchSales();

        // Check if response exists and has data
        if (!response || !response.data) {
          console.error('Invalid response structure:', response);
          setSales([]);
          return;
        }

        // Handle different response structures
        let salesData = [];

        if (response.data.data && Array.isArray(response.data.data)) {
          // Paginated response structure: response.data.data
          salesData = response.data.data;
        } else if (Array.isArray(response.data)) {
          // Direct array response: response.data
          salesData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          // Object response: try to extract array from object
          const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
          salesData = possibleArrays.length > 0 ? possibleArrays[0] : [];
        } else {
          // Fallback: empty array
          salesData = [];
        }

        // Ensure salesData is an array before mapping
        if (!Array.isArray(salesData)) {
          console.error('Sales data is not an array:', salesData);
          setSales([]);
          return;
        }

        // Transform the sales data
        const transformedSales = salesData.map(sale => ({
          id: sale.id,
          sellerName: sale.seller_name || sale.sellerName || 'Unknown',
          fruitType: sale.fruit_type || sale.fruitType || 'Unknown',
          quantitySold: sale.quantity || sale.quantitySold || 0,
          revenue: sale.revenue || 0,
          date: sale.sale_date || sale.date || new Date().toISOString().split('T')[0]
        }));

        setSales(transformedSales);
      } catch (error) {
        console.error('Failed to fetch sales:', error);
        setSales([]); // Set empty array on error to prevent map errors
      } finally {
        setLoading(false);
      }
    };
    loadSales();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const handleDelete = async (saleId) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await deleteSale(saleId);
        setSales(sales.filter(sale => sale.id !== saleId));
      } catch (error) {
        console.error('Failed to delete sale:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Ensure assignment exists for seller
      const seller_id = formData.sellerId || formData.sellerName;
      const seller_email = formData.sellerEmail || formData.sellerName;
      const fruit_type = formData.fruitType;
      const assignment_id = `assignment-${seller_id}`;
      await createAssignment({ seller_id, seller_email, fruit_type, assignment_id });
      // Post sale to assignment
      const saleData = {
        fruitType: fruit_type,
        quantity: parseFloat(formData.quantitySold),
        revenue: parseFloat(formData.revenue),
        date: formData.date
      };
      const response = await createSaleForAssignment(assignment_id, saleData);
      setSales([...sales, response]);
      setFormData({
        sellerName: '',
        fruitType: '',
        quantitySold: '',
        revenue: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create sale:', error);
    }
  };

  const clearAllSales = async () => {
    if (window.confirm('Are you sure you want to clear all sales data? This action cannot be undone.')) {
      try {
        // Implement a bulk delete endpoint in your backend
        await Promise.all(sales.map(sale => deleteSale(sale.id)));
        setSales([]);
      } catch (error) {
        console.error('Failed to clear sales:', error);
      }
    }
  };

  const downloadDailyReport = async (dateStr) => {
    try {
      const response = await fetch(`/api/sales/report/${dateStr}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
        console.error('Failed to download report');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.sellerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.fruitType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group sales by date
  const groupedSales = filteredSales.reduce((groups, sale) => {
    const date = sale.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(sale);
    return groups;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedSales).sort((a, b) => new Date(b) - new Date(a));

  if (loading) return <div className="text-center py-5">Loading sales data...</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Sales Management</h2>
        <div>
          <button
            className="btn btn-gradient me-2"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={16} className="me-1" />
            Add Sale
          </button>
          <button
            className="btn btn-outline-danger"
            onClick={clearAllSales}
            disabled={sales.length === 0}
          >
            <Trash2 size={16} className="me-1" />
            Clear All
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card card-custom mb-4">
          <div className="card-body">
            <h5 className="card-title text-gradient">Record New Sale</h5>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Seller Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.sellerName}
                    onChange={(e) => setFormData({...formData, sellerName: e.target.value})}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">Fruit Type</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.fruitType}
                    onChange={(e) => setFormData({...formData, fruitType: e.target.value})}
                    list="fruits"
                    required
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
                <div className="col-md-4 mb-3">
                  <label className="form-label">Quantity Sold</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.quantitySold}
                    onChange={(e) => setFormData({...formData, quantitySold: e.target.value})}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Revenue (KES)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={formData.revenue}
                    onChange={(e) => setFormData({...formData, revenue: e.target.value})}
                    min="0"
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-gradient">
                  Record Sale
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card card-custom mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="position-relative flex-grow-1">
              <Search className="position-absolute" style={{left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#6c757d'}} />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search sales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card card-custom">
        <div className="card-body">
          {sortedDates.length > 0 ? (
            sortedDates.map((date, index) => {
              const daySales = groupedSales[date];
              const totalRevenue = daySales.reduce((sum, sale) => sum + sale.revenue, 0);
              const totalQuantity = daySales.reduce((sum, sale) => sum + parseFloat(sale.quantitySold || 0), 0);

              return (
                <div key={date}>
                  {/* Black column separator */}
                  {index > 0 && <div style={{height: '2px', backgroundColor: 'black', margin: '20px 0'}}></div>}

                  {/* Day header with PDF download */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
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
                          Total: {formatCurrency(totalRevenue)} |
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

                  {/* Sales table for this day */}
                  <div className="table-responsive mb-4">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Seller</th>
                          <th>Fruit Type</th>
                          <th>Quantity Sold</th>
                          <th>Revenue</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {daySales.map(sale => (
                          <tr key={sale.id}>
                            <td>{sale.sellerName}</td>
                            <td>{sale.fruitType}</td>
                            <td>{sale.quantitySold}</td>
                            <td>{formatCurrency(sale.revenue)}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleDelete(sale.id)}
                                title="Delete sale"
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
              {sales.length === 0 ? 'No sales records found' : 'No matching sales found'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesTab;
