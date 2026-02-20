import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addStockTracking, fetchStockTracking } from '../api/stockTracking';
import { fetchOtherExpenses } from '../api/otherExpenses';
import { createSpolige } from '../api/spolige';
import OtherExpenseForm from '../components/OtherExpenseForm';
import OtherExpensesTable from '../components/OtherExpensesTable';
import SpoligeTab from '../components/SpoligeTab';

const initialStockIn = {
  stockName: '',
  dateIn: '',
  fruitType: '',
  quantityIn: '',
  amountPerKg: '',
  totalAmount: '',
};

const initialStockOut = {
  stockInId: '',
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
  
  const [showSpoligeForm, setShowSpoligeForm] = useState(false);
  
  const [spoligeFormData, setSpoligeFormData] = useState({
    spolige_fruit_type: '',
    spolige_amount: '',
    spolige_qty: '',
    date: new Date().toISOString().split('T')[0]
  });

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

  useEffect(() => {
    const quantity = parseFloat(stockIn.quantityIn || 0);
    const amountPerKg = parseFloat(stockIn.amountPerKg || 0);
    const total = quantity * amountPerKg;
    setStockIn((prev) => ({ ...prev, totalAmount: total ? total.toFixed(2) : '' }));
  }, [stockIn.quantityIn, stockIn.amountPerKg]);

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

  const getDuration = (dateIn, dateOut) => {
    if (dateIn && dateOut) {
      const d1 = new Date(dateIn);
      const d2 = new Date(dateOut);
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      return diff >= 0 ? diff : '';
    }
    return '';
  };

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

  const handleSpoligeChange = (e) => {
    const { name, value } = e.target;
    setSpoligeFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpoligeSubmit = async (e) => {
    e.preventDefault();
    try {
      const spoligeData = {
        fruit_name: spoligeFormData.spolige_fruit_type,
        quantity: parseFloat(spoligeFormData.spolige_qty),
        stage: 'store_stage',
        amount_per_kg: parseFloat(spoligeFormData.spolige_amount) / parseFloat(spoligeFormData.spolige_qty),
        total_amount: parseFloat(spoligeFormData.spolige_amount),
        description: 'Manual Spoilage Entry - Store Keeper',
        date: spoligeFormData.date
      };
      
      await createSpolige(spoligeData);
      
      setSpoligeFormData({
        spolige_fruit_type: '',
        spolige_amount: '',
        spolige_qty: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowSpoligeForm(false);
      
      window.dispatchEvent(new CustomEvent('spolige-update', { detail: { refresh: true } }));
      
      alert('Spoilage record added successfully!');
    } catch (err) {
      console.error('Error adding spolige:', err);
      alert('Failed to add spoilage record. Please try again.');
    }
  };

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

  const handleStockOutSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const stockInRecord = records.find(r => r.id === parseInt(stockOut.stockInId));
      if (!stockInRecord) return;
      const duration = getDuration(stockInRecord.dateIn, stockOut.dateOut);
      const totalStockCost = getTotalStockCost(
        stockOut.totalGradientCost
      );
      const record = {
        stockInId: stockOut.stockInId,
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
      setRecords((prev) => prev.map(r => r.id === res.data.id ? res.data : r));
      
      if (stockOut.spoilage && parseFloat(stockOut.spoilage) > 0) {
        const spoligeData = {
          fruit_name: stockInRecord.fruitType || stockInRecord.stockName || 'Unknown',
          quantity: parseFloat(stockOut.spoilage),
          stage: 'store_stage',
          amount_per_kg: parseFloat(stockInRecord.amountPerKg) || 0,
          total_amount: parseFloat(stockOut.spoilage) * (parseFloat(stockInRecord.amountPerKg) || 0),
          description: `From Store Stock Out: ${stockInRecord.stockName}`,
          date: stockOut.dateOut
        };
        
        await createSpolige(spoligeData);
      }
      
      setStockOut(initialStockOut);
    } catch (e) {}
  };

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
                  <input type="number" className="form-control" name="amountPerKg" value={stockIn.amountPerKg} onChange={handleStockInChange} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Total Amount</label>
                  <input type="number" className="form-control" name="totalAmount" value={stockIn.totalAmount} readOnly disabled />
                </div>

                <button type="submit" className="btn btn-success w-100">Submit Stock In</button>
              </form>
            </div>
          </div>

          <div className="mb-3">
            <button 
              type="button" 
              className="btn btn-outline-warning btn-sm w-100"
              onClick={() => setShowSpoligeForm(!showSpoligeForm)}
            >
              <i className={`bi ${showSpoligeForm ? 'bi-chevron-up' : 'bi-chevron-down'} me-2`}></i>
              {showSpoligeForm ? 'Hide Spoilage Form' : 'Add Spoilage'}
            </button>
          </div>
          
          {showSpoligeForm && (
            <div className="card mb-4">
              <div className="card-header bg-warning text-dark">
                <h5 className="mb-0"><i className="bi bi-exclamation-triangle me-2"></i>Spoilage Details</h5>
              </div>
              <div className="card-body bg-light border-warning">
                <form onSubmit={handleSpoligeSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-2">
                      <label className="form-label">Fruit Type</label>
                      <select
                        className="form-control"
                        name="spolige_fruit_type"
                        value={spoligeFormData.spolige_fruit_type}
                        onChange={handleSpoligeChange}
                        required
                      >
                        <option value="">Select Fruit</option>
                        <option value="Sweet banana">Sweet banana</option>
                        <option value="Kampala">Kampala</option>
                        <option value="Cavendish">Cavendish</option>
                        <option value="Plantain">Plantain</option>
                        <option value="Matoke">Matoke</option>
                        <option value="American sweet potatoes">American sweet potatoes</option>
                        <option value="White sweet potatoes">White sweet potatoes</option>
                        <option value="Red sweet potatoes">Red sweet potatoes</option>
                        <option value="Local Avocados">Local Avocados</option>
                        <option value="Hass Avocados">Hass Avocados</option>
                        <option value="Oranges">Oranges</option>
                        <option value="Pixie">Pixie</option>
                        <option value="Lemons">Lemons</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label">Date</label>
                      <input
                        type="date"
                        className="form-control"
                        name="date"
                        value={spoligeFormData.date}
                        onChange={handleSpoligeChange}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label">Amount (KES)</label>
                      <input
                        type="number"
                        placeholder="Amount"
                        className="form-control"
                        name="spolige_amount"
                        value={spoligeFormData.spolige_amount}
                        onChange={handleSpoligeChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-2">
                      <label className="form-label">Qty (KG)</label>
                      <input
                        type="number"
                        placeholder="Quantity in KG"
                        className="form-control"
                        name="spolige_qty"
                        value={spoligeFormData.spolige_qty}
                        onChange={handleSpoligeChange}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-warning mt-2"
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Record Spoilage
                  </button>
                </form>
              </div>
            </div>
          )}

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
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <SpoligeTab />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreKeeperDashboard;
