import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStockTracking, fetchStockTrackingAggregated, fetchSales } from '../api/stockTracking';

const StockTrackerTab = () => {
  const [data, setData] = useState({
    inventory: [],
    stockMovements: [],
    purchases: [],
    sales: [],
    otherExpenses: [],
    stockTracking: [],
    stockExpenses: [],
    fruitProfitability: [],
    salesData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showProfitLossModal, setShowProfitLossModal] = useState(false);

  const navigate = useNavigate();
  
  const goToStockTrackingOverview = () => {
    navigate('/stock-tracking-records');
  };

  const handleTrackStock = (stockName) => {
    navigate('/stock-tracking-records', { state: { filterStock: stockName } });
  };

  const handleViewProfitLoss = (stock) => {
    setSelectedStock(stock);
    setShowProfitLossModal(true);
  };

  const closeModal = () => {
    setShowProfitLossModal(false);
    setSelectedStock(null);
  };

  const loadData = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const [
        stockTrackingRes,
        aggregatedRes,
        salesRes
      ] = await Promise.all([
        fetchStockTracking(token),
        fetchStockTrackingAggregated(token),
        fetchSales(token)
      ]);

      console.log('Fetched sales data:', salesRes.data);

      setData(prevData => ({
        ...prevData,
        stockTracking: stockTrackingRes.data || [],
        stockExpenses: aggregatedRes.data || [],
        salesData: salesRes.data || []
      }));
    } catch (err) {
      console.error('Failed to load stock tracker data:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load data. Please try again.';
      setError(errorMessage);
      if (errorMessage.toLowerCase().includes('token') || errorMessage.toLowerCase().includes('unauthorized')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Set up polling for real-time updates
  useEffect(() => {
    const interval = setInterval(loadData, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
        <button
          className="btn btn-sm btn-outline-danger ms-3"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const stockTrackingArr = Array.isArray(data.stockTracking) ? data.stockTracking : [];
  const stockExpensesArr = Array.isArray(data.stockExpenses) ? data.stockExpenses : [];
  const salesArr = Array.isArray(data.salesData) ? data.salesData : [];

  // Create a map of stock_name to actual sales revenue
  const salesRevenueMap = {};
  salesArr.forEach(sale => {
    if (sale.stock_name) {
      if (!salesRevenueMap[sale.stock_name]) {

      }
      salesRevenueMap[sale.stock_name] += sale.amount || 0;
    }
  });

  console.log('Sales revenue map:', salesRevenueMap);
  // Group stocks by dateOut (only those with dateOut)
  const groupedStocks = stockTrackingArr
    .filter(stock => stock.dateOut) // Only stocks that have come out
    .reduce((groups, stock) => {
      const dateKey = stock.dateOut;
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateOut: stock.dateOut,
          stockNames: new Set(),
          totalPurchased: 0,
          totalSold: 0,
          stocks: []
        };
      }
      groups[dateKey].stockNames.add(stock.stockName);
      groups[dateKey].totalPurchased += stock.totalAmount;
      groups[dateKey].totalSold += salesRevenueMap[stock.stockName] || 0;
      groups[dateKey].stocks.push(stock);
      return groups;
    }, {});

  // Convert to array and sort by date descending, take first 5
  const groupedStocksArray = Object.values(groupedStocks)
    .sort((a, b) => new Date(b.dateOut) - new Date(a.dateOut))
    .slice(0, 5);

  const handleDownloadPDF = async (recordId) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`/api/stock-tracking/pdf/${recordId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_report_${recordId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF download error:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleDownloadGroupPDF = async (date, type) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`/api/stock-tracking/pdf/group?date=${date}&type=${type}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download group PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_report_${type}_${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Group PDF download error:', error);
      alert('Failed to download group PDF. Please try again.');
    }
  };

  const handleDownloadCombinedPDF = async (date) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`/api/stock-tracking/pdf/combined?date=${date}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download combined PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stock_report_combined_${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Combined PDF download error:', error);
      alert('Failed to download combined PDF. Please try again.');
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Stock Tracking Records */}
      <div className="row mb-4">
        <div className="col">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Stock Tracking Records</h5>
              <button
                className="btn btn-light btn-sm"
                onClick={goToStockTrackingOverview}
              >
                View Overview
              </button>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th>Stock Name</th>
                      <th>Date In</th>
                      <th>Fruit Type</th>
                      <th>Quantity In</th>
                      <th>Amount per Kg</th>
                      <th>Total Amount</th>
                      <th>Other Charges</th>
                      <th>Duration</th>
                      <th>Gradient Used</th>
                      <th>Gradient Amount Used</th>
                      <th>Gradient Cost per Unit</th>
                      <th>Total Gradient Cost</th>
                      <th>Date Out</th>
                      <th>Quantity Out</th>
                      <th>Spoilage</th>
                      <th>Total Stock Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockTrackingArr.length > 0 ? (
                      stockTrackingArr.sort((a, b) => new Date(b.dateIn) - new Date(a.dateIn)).map((rec, idx) => (
                        <React.Fragment key={rec.id || idx}>
                          <tr>
                            <td>{rec.stockName}</td>
                            <td>{rec.dateIn}</td>
                            <td>{rec.fruitType}</td>
                            <td>{rec.quantityIn}</td>
                            <td>{rec.amountPerKg}</td>
                            <td>{rec.totalAmount}</td>
                            <td>{rec.otherCharges}</td>
                            <td>{rec.duration}</td>
                            <td>{rec.gradientUsed}</td>
                            <td>{rec.gradientAmountUsed}</td>
                            <td>{rec.gradientCostPerUnit}</td>
                            <td>{rec.totalGradientCost}</td>
                            <td>{rec.dateOut}</td>
                            <td>{rec.quantityOut}</td>
                            <td>{rec.spoilage}</td>
                            <td>{rec.totalStockCost}</td>
                          </tr>
                          {rec.dateOut && (
                            <tr>
                              <td colSpan="16" className="text-center">
                                <button
                                  className="btn btn-sm btn-success me-2"
                                  onClick={() => handleDownloadPDF(rec.id)}
                                >
                                  Download PDF Report
                                </button>
                                <button
                                  className="btn btn-sm btn-warning me-2"
                                  onClick={() => handleDownloadGroupPDF(rec.dateIn, 'in')}
                                >
                                  {rec.dateIn} In
                                </button>
                                <button
                                  className="btn btn-sm btn-warning me-2"
                                  onClick={() => handleDownloadGroupPDF(rec.dateOut, 'out')}
                                >
                                  {rec.dateOut} Out
                                </button>
                                <button
                                  className="btn btn-sm btn-info"
                                  onClick={() => handleDownloadCombinedPDF(rec.dateOut || rec.dateIn)}
                                >
                                  Combined PDF
                                </button>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr><td colSpan="16" className="text-center text-muted">No stock tracking records yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Profit/Loss View */}
      {showProfitLossModal && selectedStock && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Profit/Loss Analysis - {selectedStock.stockName}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <p><strong>Initial Cost:</strong> ${selectedStock.totalAmount}</p>
                <p><strong>Gradient Cost:</strong> ${selectedStock.totalGradientCost || 0}</p>
                <p><strong>Other Charges:</strong> ${selectedStock.otherCharges || 0}</p>
                <p><strong>Total Stock Cost:</strong> ${selectedStock.totalStockCost || 0}</p>
                {selectedStock.dateOut && (
                  <>
                    <hr />
                    <p><strong>Duration:</strong> {selectedStock.duration} days</p>
                    <p><strong>Quantity Out:</strong> {selectedStock.quantityOut} Kg</p>
                    <p><strong>Spoilage:</strong> {selectedStock.spoilage || 0} Kg</p>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showProfitLossModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default StockTrackerTab;
