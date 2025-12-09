import React, { useState, useEffect } from 'react';
import { getCustomerDebts, getSales, updateSale, downloadCustomerDebtReport } from '../api/sales';

const AccountTab = () => {
  const [debtsData, setDebtsData] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCustomers, setExpandedCustomers] = useState({});
  const [saveTimeouts, setSaveTimeouts] = useState({});

  useEffect(() => {
    fetchDebtsData();
    fetchSalesData();
  }, []);

  const fetchDebtsData = async () => {
    try {
      const response = await getCustomerDebts();
      setDebtsData(response.data.debts);
    } catch (err) {
      setError('Failed to fetch debts data');
    }
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const response = await getSales();
      setSalesData(response.data.sales);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch sales data');
      setLoading(false);
    }
  };

  const handlePaidAmountChange = (index, value) => {
    const updatedSales = [...salesData];
    const paidAmount = parseFloat(value) || 0;
    updatedSales[index].paid_amount = paidAmount;
    updatedSales[index].remaining_amount = updatedSales[index].amount - paidAmount;
    setSalesData(updatedSales);

    // Clear previous timeout for this sale
    if (saveTimeouts[updatedSales[index].id]) {
      clearTimeout(saveTimeouts[updatedSales[index].id]);
    }

    // Set new timeout to save after 0.5 second
    const timeoutId = setTimeout(() => {
      handleSavePaidAmount(updatedSales[index].id);
      setSaveTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[updatedSales[index].id];
        return newTimeouts;
      });
    }, 1000);

    setSaveTimeouts(prev => ({ ...prev, [updatedSales[index].id]: timeoutId }));
  };

  const handleSavePaidAmount = async (saleId) => {
    const sale = salesData.find(s => s.id === saleId);
    if (!sale) return;
    try {
      await updateSale(sale.id, {
        stock_name: sale.stock_name,
        fruit_name: sale.fruit_name,
        qty: sale.qty,
        unit_price: sale.unit_price,
        paid_amount: sale.paid_amount,
        date: sale.date,
        customer_name: sale.customer_name,
      });
      // Clear the timeout if it exists
      if (saveTimeouts[saleId]) {
        clearTimeout(saveTimeouts[saleId]);
        setSaveTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[saleId];
          return newTimeouts;
        });
      }
      // Optionally refetch to ensure consistency
      fetchDebtsData();
    } catch (err) {
      alert('Failed to save paid amount.');
    }
  };

  const handleSaveAll = async () => {
    try {
      for (const sale of salesData) {
        await updateSale(sale.id, {
          stock_name: sale.stock_name,
          fruit_name: sale.fruit_name,
          qty: sale.qty,
          unit_price: sale.unit_price,
          paid_amount: sale.paid_amount,
          date: sale.date,
          customer_name: sale.customer_name,
        });
      }
      alert('All changes saved successfully.');
      fetchDebtsData();
      fetchSalesData();
    } catch (err) {
      alert('Failed to save changes.');
    }
  };

  const toggleExpand = (customerName) => {
    setExpandedCustomers(prev => ({
      ...prev,
      [customerName]: !prev[customerName]
    }));
  };

  const getCustomerSales = (customerName) => {
    return salesData.filter(sale => sale.customer_name === customerName);
  };

  const handleDownloadReport = async (customerName) => {
    try {
      await downloadCustomerDebtReport(customerName);
    } catch (error) {
      alert('Failed to download report.');
    }
  };

  // New helper to calculate total debt dynamically from salesData
  const calculateTotalDebt = (customerName) => {
    const customerSales = getCustomerSales(customerName);
    return customerSales.reduce((acc, sale) => acc + sale.remaining_amount, 0);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4 card shadow-sm" style={{ height: '100%', width: '100%', overflowX: 'auto' }}>
      <h2 className="text-xl font-bold mb-4">Account Tab</h2>
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-2 py-1">Customer Name</th>
            <th className="border border-gray-300 px-2 py-1">Total Debt</th>
            <th className="border border-gray-300 px-2 py-1">Details</th>
            <th className="border border-gray-300 px-2 py-1">Download PDF</th>
          </tr>
        </thead>
        <tbody>
          {debtsData.map((debt) => (
            <React.Fragment key={debt.customer_name}>
              <tr>
                <td className="border border-gray-300 px-2 py-1">{debt.customer_name}</td>
                <td className="border border-gray-300 px-2 py-1">{calculateTotalDebt(debt.customer_name).toFixed(2)}</td>
                <td className="border border-gray-300 px-2 py-1">
                  <button
                    onClick={() => toggleExpand(debt.customer_name)}
                    className="btn btn-sm btn-outline"
                  >
                    {expandedCustomers[debt.customer_name] ? 'Hide' : 'Show'} Details
                  </button>
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <button
                    onClick={() => handleDownloadReport(debt.customer_name)}
                    className="btn btn-sm btn-primary"
                  >
                    Download PDF
                  </button>
                </td>
              </tr>
              {expandedCustomers[debt.customer_name] && (
                <tr>
                  <td colSpan="4" className="border border-gray-300 px-2 py-1">
                    <table className="table-auto w-full border-collapse border border-gray-200">
                      <thead>
                        <tr>
                          <th className="border border-gray-200 px-1 py-0.5">Stock Name</th>
                          <th className="border border-gray-200 px-1 py-0.5">Date</th>
                          <th className="border border-gray-200 px-1 py-0.5">Expected Amount</th>
                          <th className="border border-gray-200 px-1 py-0.5">Paid Amount</th>
                          <th className="border border-gray-200 px-1 py-0.5">Remaining Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCustomerSales(debt.customer_name).map((sale, index) => (
                          <tr key={sale.id}>
                            <td className="border border-gray-200 px-1 py-0.5">{sale.stock_name}</td>
                            <td className="border border-gray-200 px-1 py-0.5">{sale.date}</td>
                            <td className="border border-gray-200 px-1 py-0.5">{sale.amount.toFixed(2)}</td>
                            <td className="border border-gray-200 px-1 py-0.5">
                              <input
                                type="number"
                                value={sale.paid_amount || ''}
                                onChange={(e) => handlePaidAmountChange(salesData.findIndex(s => s.id === sale.id), e.target.value)}
                                onBlur={() => handleSavePaidAmount(sale.id)}
                                className="w-full border border-gray-300 rounded px-1 py-0.5"
                                min="0"
                                max={sale.amount}
                              />
                            </td>
                            <td className="border border-gray-200 px-1 py-0.5">{sale.remaining_amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <button onClick={handleSaveAll} className="btn btn-primary mt-4">Save Changes</button>
    </div>
  );
};

export default AccountTab;
