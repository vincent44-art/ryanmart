import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addStockTracking, fetchStockTracking } from '../api/stockTracking';
import { fetchOtherExpenses } from '../api/otherExpenses';
import OtherExpenseForm from '../components/OtherExpenseForm';
import OtherExpensesTable from '../components/OtherExpensesTable';

const initialStockIn = {
  stockName: '',
  dateIn: '',
  fruitType: '',
  quantityIn: '',
  amountPerKg: '',
  totalAmount: '',
};

const initialStockOut = {
  stockInId: '', // Link to Stock In record
  dateOut: '',
  gradientUsed: '',
  gradientAmountUsed: '',
  gradientCostPerUnit: '',
  totalGradientCost: '',
  quantityOut: '',
  spoilage: '',
};

const StoreKeeperDashboard = () => {
  const { logout } = useAuth();
  const [stockIn, setStockIn] = useState(initialStockIn);
  const [stockOut, setStockOut] = useState(initialStockOut);
  const [records, setRecords] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);

  const handleDownloadPDF = async (recordId) => {
    try {
      const token = localStorage.getItem('access_token');
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
      const token = localStorage.getItem('access_token');
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

  // Fetch all stock records and other expenses on mount
  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const [stockRes, expensesRes] = await Promise.all([
          fetchStockTracking(token),
          fetchOtherExpenses()
        ]);
        const stockList = Array.isArray(stockRes?.data) ? stockRes.data : (Array.isArray(stockRes) ? stockRes : []);
        setRecords(stockList);
        setOtherExpenses(expensesRes?.data || []);
      } catch (e) {}
    };
    load();
  }, []);



  useEffect(() => {
    const totalGradientCost = parseFloat(stockOut.gradientAmountUsed || 0) * parseFloat(stockOut.gradientCostPerUnit || 0);
    setStockOut((prev) => ({ ...prev, totalGradientCost: totalGradientCost ? totalGradientCost.toFixed(2) : '' }));
  }, [stockOut.gradientAmountUsed, stockOut.gradientCostPerUnit]);

  // Auto-calculate totalAmount for Stock In
  useEffect(() => {
    const quantity = parseFloat(stockIn.quantityIn || 0);
    const amountPerKg = parseFloat(stockIn.amountPerKg || 0);
    const total = quantity * amountPerKg;
    setStockIn((prev) => ({ ...prev, totalAmount: total ? total.toFixed(2) : '' }));
  }, [stockIn.quantityIn, stockIn.amountPerKg]);

  // Auto-calculate spoilage: spoilage = quantityIn - quantityOut
  useEffect(() => {
    if (stockOut.stockInId && stockOut.quantityOut !== '') {
      const stockInRecord = records.find(r => r.id === parseInt(stockOut.stockInId));
      const quantityIn = parseFloat(stockInRecord?.quantityIn || 0);
      const quantityOut = parseFloat(stockOut.quantityOut || 0);
      const spoilage = quantityIn - quantityOut;
      setStockOut((prev) => ({ ...prev, spoilage: spoilage >= 0 ? spoilage.toFixed(2) : '' }));
    } else {
      setStockOut((prev) => ({ ...prev, spoilage: '' }));
    }
  }, [stockOut.quantityOut, stockOut.stockInId, records]);

  // Auto-calculate duration
  const getDuration = (dateIn, dateOut) => {
    if (dateIn && dateOut) {
      const d1 = new Date(dateIn);
      const d2 = new Date(dateOut);
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      return diff >= 0 ? diff : '';
    }
    return '';
  };

  // Auto-calculate total stock cost
  const getTotalStockCost = (totalGradientCost) => {
    const tgc = parseFloat(totalGradientCost || 0);
    return tgc.toFixed(2);
  };

  const handleStockInChange = (e) => {
    const { name, value } = e.target;
    setStockIn((prev) => ({ ...prev, [name]: value }));
  };
  const handleStockOutChange = (e) => {
    const { name, value } = e.target;
    setStockOut((prev) => ({ ...prev, [name]: value }));
  };

  const handleOtherExpenseAdded = (newExpense) => {
    setOtherExpenses(prev => [newExpense, ...prev]);
  };

  const handleOtherExpenseDeleted = (deletedId) => {
    setOtherExpenses(prev => prev.filter(expense => expense.id !== deletedId));
  };

  // Submit Stock In
  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const record = { ...stockIn };
      const res = await addStockTracking(record, token);
      setRecords((prev) => ([...(Array.isArray(prev) ? prev : []), res.data]));
      setStockIn(initialStockIn);
    } catch (e) {}
  };

  // Submit Stock Out
  const handleStockOutSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      // Find the selected Stock In record
      const stockInRecord = records.find(r => r.id === parseInt(stockOut.stockInId));
      if (!stockInRecord) return;
      const duration = getDuration(stockInRecord.dateIn, stockOut.dateOut);
      const totalStockCost = getTotalStockCost(
        stockOut.totalGradientCost
      );
      // Prepare data for updating the existing record
      const record = {
        stockInId: stockOut.stockInId, // Include stockInId to indicate update
        dateOut: stockOut.dateOut,
        duration,
        gradientUsed: stockOut.gradientUsed,
        gradientAmountUsed: stockOut.gradientAmountUsed,
        gradientCostPerUnit: stockOut.gradientCostPerUnit,
        totalGradientCost: stockOut.totalGradientCost,
        quantityOut: stockOut.quantityOut,
        spoilage: stockOut.spoilage,
        totalStockCost,
      };
      const res = await addStockTracking(record, token);
      // Update the records state with the updated record
      setRecords((prev) => prev.map(r => r.id === res.data.id ? res.data : r));
      setStockOut(initialStockOut);
    } catch (e) {}
  };

  // Only show Stock In records that have not been stocked out (no dateOut)
  const recordsArr = Array.isArray(records) ? records : [];
  const availableStockIn = recordsArr.filter(r => !r.dateOut);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-end mb-3">
        <button className="btn btn-outline-danger" onClick={logout}>
          <i className="bi bi-box-arrow-right me-1"></i>Logout
        </button>
      </div>
      <div className="row">
        {/* Stock In Form */}
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">Stock In Form</div>
            <div className="card-body">
              <form onSubmit={handleStockInSubmit}>
                <div className="mb-3">
                  <label className="form-label">Stock Name</label>
                  <input type="text" className="form-control" name="stockName" value={stockIn.stockName} onChange={handleStockInChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date In</label>
                  <input type="date" className="form-control" name="dateIn" value={stockIn.dateIn} onChange={handleStockInChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Fruit Type</label>
                  <input type="text" className="form-control" name="fruitType" value={stockIn.fruitType} onChange={handleStockInChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Quantity In (Kg)</label>
                  <input type="number" className="form-control" name="quantityIn" value={stockIn.quantityIn} onChange={handleStockInChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Amount per Kg</label>
                  <input type="number" className="form-control" name="amountPerKg" value={stockIn.amountPerKg} onChange={handleStockInChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Total Amount</label>
                  <input type="number" className="form-control" name="totalAmount" value={stockIn.totalAmount} readOnly />
                </div>

                <button type="submit" className="btn btn-success w-100">Submit Stock In</button>
              </form>
            </div>
          </div>

          {/* Other Expenses Form and Table */}
          <div className="card">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">Other Expenses Management</h5>
            </div>
            <div className="card-body">
              <OtherExpenseForm onExpenseAdded={handleOtherExpenseAdded} />
              <hr />
              <OtherExpensesTable expenses={otherExpenses} onExpenseDeleted={handleOtherExpenseDeleted} />
            </div>
          </div>
        </div>
        {/* Stock Out Form */}
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header bg-info text-white">Stock Out Form</div>
            <div className="card-body">
              <form onSubmit={handleStockOutSubmit}>
                <div className="mb-3">
                  <label className="form-label">Select Stock In</label>
                  <select className="form-select" name="stockInId" value={stockOut.stockInId} onChange={handleStockOutChange} required>
                    <option value="">-- Select --</option>
                    {availableStockIn.map((rec) => (
                      <option key={rec.id} value={rec.id}>
                        {rec.stockName} | {rec.fruitType} | {rec.dateIn}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Date Out</label>
                  <input type="date" className="form-control" name="dateOut" value={stockOut.dateOut} onChange={handleStockOutChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Duration (days)</label>
                  <input type="number" className="form-control" name="duration" value={getDuration(availableStockIn.find(r => r.id === parseInt(stockOut.stockInId))?.dateIn, stockOut.dateOut)} readOnly />
                </div>
                <div className="mb-3">
                  <label className="form-label">Gradient Used</label>
                  <input type="text" className="form-control" name="gradientUsed" value={stockOut.gradientUsed} onChange={handleStockOutChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Gradient Amount Used</label>
                  <input type="number" className="form-control" name="gradientAmountUsed" value={stockOut.gradientAmountUsed} onChange={handleStockOutChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Gradient Cost per Unit</label>
                  <input type="number" className="form-control" name="gradientCostPerUnit" value={stockOut.gradientCostPerUnit} onChange={handleStockOutChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Total Gradient Cost</label>
                  <input type="number" className="form-control" name="totalGradientCost" value={stockOut.totalGradientCost} readOnly />
                </div>
                <div className="mb-3">
                  <label className="form-label">Quantity Out</label>
                  <input type="number" className="form-control" name="quantityOut" value={stockOut.quantityOut} onChange={handleStockOutChange} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Spoilage</label>
                  <input type="number" className="form-control" name="spoilage" value={stockOut.spoilage} onChange={handleStockOutChange} />
                </div>
                <button type="submit" className="btn btn-primary w-100">Submit Stock Out</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      {/* Table remains unchanged */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-dark text-white">Stock Tracking Table</div>
            <div className="card-body table-responsive">
              <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th>Stock Name</th>
                      <th>Date In</th>
                      <th>Fruit Type</th>
                      <th>Quantity In</th>
                      <th>Amount per Kg</th>
                      <th>Total Amount</th>
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
                  {recordsArr.map((rec, idx) => (
                    <React.Fragment key={rec.id || idx}>
                      <tr>
                        <td>{rec.stockName}</td>
                        <td>{rec.dateIn}</td>
                        <td>{rec.fruitType}</td>
                        <td>{rec.quantityIn}</td>
                        <td>{rec.amountPerKg}</td>
                        <td>{rec.totalAmount}</td>
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
                          <td colSpan="15" className="text-center">
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
                              className="btn btn-sm btn-warning"
                              onClick={() => handleDownloadGroupPDF(rec.dateOut, 'out')}
                            >
                              {rec.dateOut} Out
                            </button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {records.length === 0 && (
                    <tr><td colSpan="15" className="text-center text-muted">No records yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreKeeperDashboard;
