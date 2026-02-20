import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
  ArcElement,
} from 'chart.js';

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  Activity
} from 'lucide-react';
import {
  fetchInventory,
  fetchStockMovements,
  fetchPurchases,
  fetchSales,
  fetchOtherExpenses,
  fetchUsers,
  fetchSalaries,
  fetchCarExpenses
} from './apiHelpers';
import { fetchStockTracking, fetchStockTrackingAggregated } from '../api/stockTracking';
import { fetchSellerFruits } from '../api/sellerFruits';
import { fetchSpolige } from '../api/spolige';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  ChartLegend,
  ArcElement
);

const ReportsTabAnalytics = () => {
  const [data, setData] = useState({
    inventory: [],
    stockMovements: [],
    purchases: [],
    sales: [],
    otherExpenses: [],
    users: [],
    stockTracking: [],
    sellerFruits: [],
    salaries: [],
    carExpenses: [],
    stockExpenses: [],
    fruitProfitability: [],
    spolige: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    const loadData = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required. Please log in to access reports.');
        setLoading(false);
        return;
      }

      try {
        const [
          inventoryRes,
          movementsRes,
          purchasesRes,
          salesRes,
          expensesRes,
          usersRes,
          stockTrackingRes,
          sellerFruitsRes,
          salariesRes,
          carExpensesRes,
          aggregatedRes,
          spoligeRes
        ] = await Promise.all([
          fetchInventory(token),
          fetchStockMovements(token),
          fetchPurchases(null, token),
          fetchSales(null, token),
          fetchOtherExpenses(token),
          fetchUsers(token),
          fetchStockTracking(token),
          fetchSellerFruits(token),
          fetchSalaries(token),
          fetchCarExpenses(token),
          fetchStockTrackingAggregated(token),
          fetchSpolige()
        ]);

        setData({
          inventory: Array.isArray(inventoryRes.data?.data) ? inventoryRes.data.data : inventoryRes.data || [],
          stockMovements: Array.isArray(movementsRes.data?.data) ? movementsRes.data.data : movementsRes.data || [],
          stockTracking: Array.isArray(stockTrackingRes.data?.data) ? stockTrackingRes.data.data :
                        Array.isArray(stockTrackingRes.data) ? stockTrackingRes.data : [],
          purchases: Array.isArray(purchasesRes.data?.data?.items) ? purchasesRes.data.data.items :
                    Array.isArray(purchasesRes.data?.data) ? purchasesRes.data.data :
                    Array.isArray(purchasesRes.data) ? purchasesRes.data :
                    Array.isArray(purchasesRes) ? purchasesRes : [],
          sales: Array.isArray(salesRes) ? salesRes : [],
          otherExpenses: Array.isArray(expensesRes.data?.data) ? expensesRes.data.data : expensesRes.data || [],
          users: Array.isArray(usersRes.data?.data) ? usersRes.data.data : usersRes.data || [],
          sellerFruits: Array.isArray(sellerFruitsRes) ? sellerFruitsRes : [],
          salaries: Array.isArray(salariesRes.data?.data) ? salariesRes.data.data : salariesRes.data || [],
          carExpenses: Array.isArray(carExpensesRes.data?.data) ? carExpensesRes.data.data : carExpensesRes.data || [],
          stockExpenses: Array.isArray(aggregatedRes.data?.data?.stock_expenses) ? aggregatedRes.data.data.stock_expenses : [],
          fruitProfitability: Array.isArray(aggregatedRes.data?.data?.fruit_profitability) ? aggregatedRes.data.data.fruit_profitability : [],
          spolige: Array.isArray(spoligeRes.data) ? spoligeRes.data : spoligeRes.data?.data || []
        });
      } catch (err) {
        console.error('Failed to load analytics data:', err);
        if (err.response?.status === 401 || err.status === 401) {
          setError('Authentication required. Please log in to access reports.');
        } else if (err.response?.status === 403 || err.status === 403) {
          setError('Access denied. Please check your permissions.');
        } else if (err.response?.status >= 500) {
          setError('Server error. Please try again later or contact support.');
        } else if (err.message?.includes('Network Error') || err.status === 0) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError('Failed to load data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  const calculateBusinessMetrics = () => {
    const allSales = Array.isArray(data.sales) && Array.isArray(data.sellerFruits) ? [...data.sales, ...data.sellerFruits] : [];
    const totalRevenue = allSales.reduce((sum, sale) => sum + (parseFloat(sale.amount || sale.revenue) || 0), 0);
    const totalQuantity = allSales.reduce((sum, sale) => sum + (parseFloat(sale.qty || sale.quantitySold || sale.quantity) || 0), 0);
    const totalPurchases = Array.isArray(data.purchases) ? data.purchases.reduce((sum, purchase) => sum + (parseFloat(purchase.amount || purchase.totalAmount || 0) || 0), 0) : 0;
    const totalExpenses = Array.isArray(data.otherExpenses) ? data.otherExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0) : 0;
    const totalProfit = totalRevenue - totalPurchases - totalExpenses;

    return {
      totalRevenue,
      totalQuantity,
      totalPurchases,
      totalExpenses,
      totalProfit,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    };
  };

  const calculateFruitProfitability = () => {
    const allSales = Array.isArray(data.sales) && Array.isArray(data.sellerFruits) ? [...data.sales, ...data.sellerFruits] : [];
    const fruitMetrics = {};

    const normalizeFruitName = (name) => {
      if (!name) return '';
      return name.toLowerCase().trim();
    };

    if (Array.isArray(data.purchases) && data.purchases.length > 0) {
      data.purchases.forEach(purchase => {
        const fruitType = normalizeFruitName(purchase.fruitType || purchase.fruit_type || purchase.fruit);
        const purchasedQuantity = parseFloat(purchase.quantity || 0);
        const purchasedAmount = parseFloat(purchase.amount || purchase.totalAmount || 0);

        if (!fruitType) return;

        if (!fruitMetrics[fruitType]) {
          fruitMetrics[fruitType] = {
            fruitType: purchase.fruitType || purchase.fruit_type || purchase.fruit,
            purchasedQuantity: 0,
            purchasedAmount: 0,
            soldQuantity: 0,
            soldAmount: 0,
            salesCount: 0,
            purchaseCount: 0
          };
        }

        fruitMetrics[fruitType].purchasedQuantity += purchasedQuantity;
        fruitMetrics[fruitType].purchasedAmount += purchasedAmount;
        fruitMetrics[fruitType].purchaseCount += 1;
      });
    }

    allSales.forEach(sale => {
      const fruitType = normalizeFruitName(sale.fruit_name || sale.fruit_type || sale.fruitType || sale.fruit);
      const revenue = parseFloat(sale.amount || sale.revenue || 0);
      const quantity = parseFloat(sale.qty || sale.quantitySold || sale.quantity || 0);

      if (!fruitType || isNaN(revenue) || isNaN(quantity)) return;

      if (!fruitMetrics[fruitType]) {
        fruitMetrics[fruitType] = {
          fruitType: sale.fruit_name || sale.fruit_type || sale.fruitType || sale.fruit,
          purchasedQuantity: 0,
          purchasedAmount: 0,
          soldQuantity: 0,
          soldAmount: 0,
          salesCount: 0,
          purchaseCount: 0
        };
      }

      fruitMetrics[fruitType].soldQuantity += quantity;
      fruitMetrics[fruitType].soldAmount += revenue;
      fruitMetrics[fruitType].salesCount += 1;
    });

    Object.keys(fruitMetrics).forEach(fruitType => {
      const metrics = fruitMetrics[fruitType];
      metrics.purchasedQuantity = parseFloat(metrics.purchasedQuantity) || 0;
      metrics.purchasedAmount = parseFloat(metrics.purchasedAmount) || 0;
      metrics.soldQuantity = parseFloat(metrics.soldQuantity) || 0;
      metrics.soldAmount = parseFloat(metrics.soldAmount) || 0;
      
      metrics.totalProfit = metrics.soldAmount - metrics.purchasedAmount;
      metrics.profitMargin = metrics.soldAmount > 0 ? (metrics.totalProfit / metrics.soldAmount) * 100 : 0;
    });

    return Object.values(fruitMetrics).sort((a, b) => b.totalProfit - a.totalProfit);
  };

  const calculateExpenseBreakdown = () => {
    const expenses = Array.isArray(data.otherExpenses) ? [...data.otherExpenses] : [];
    const expenseByCategory = {};

    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      const amount = parseFloat(expense.amount || 0);

      if (!expenseByCategory[category]) {
        expenseByCategory[category] = { category, amount: 0, count: 0 };
      }

      expenseByCategory[category].amount += amount;
      expenseByCategory[category].count += 1;
    });

    return Object.values(expenseByCategory);
  };

  const calculateSpoligeByFruit = () => {
    const spoligeData = Array.isArray(data.spolige) ? data.spolige : [];
    const fruitMetrics = {};

    spoligeData.forEach(record => {
      const fruitType = record.fruit_name || record.fruitType || 'Unknown';
      const quantity = parseFloat(record.quantity || 0);
      const totalAmount = parseFloat(record.total_amount || record.amount || 0);

      if (!fruitMetrics[fruitType]) {
        fruitMetrics[fruitType] = {
          fruitType,
          totalQuantity: 0,
          totalAmount: 0,
          count: 0
        };
      }

      fruitMetrics[fruitType].totalQuantity += quantity;
      fruitMetrics[fruitType].totalAmount += totalAmount;
      fruitMetrics[fruitType].count += 1;
    });

    return Object.values(fruitMetrics).sort((a, b) => b.totalAmount - a.totalAmount);
  };

  const calculateWeeklySummaries = () => {
    const weeklyData = {};
    const getWeekKey = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d)) return null;
      const year = d.getFullYear();
      const firstDayOfYear = new Date(year, 0, 1);
      const dayOfYear = Math.floor((d - firstDayOfYear) / (24 * 60 * 60 * 1000)) + 1;
      const weekNumber = Math.ceil(dayOfYear / 7);
      return `${year}-W${String(weekNumber).padStart(2, '0')}`;
    };

    if (Array.isArray(data.purchases)) {
      data.purchases.forEach(purchase => {
        const week = getWeekKey(purchase.date);
        if (!week) return;
        if (!weeklyData[week]) {
          weeklyData[week] = { week, salesTotal: 0, purchasesTotal: 0, expensesTotal: 0, salariesTotal: 0, carExpensesTotal: 0, fruitProfits: {} };
        }
        weeklyData[week].purchasesTotal += parseFloat(purchase.totalAmount || purchase.amount || 0);
      });
    }

    if (Array.isArray(data.sales)) {
      data.sales.forEach(sale => {
        const week = getWeekKey(sale.date || sale.sale_date);
        if (!week) return;
        if (!weeklyData[week]) {
          weeklyData[week] = { week, salesTotal: 0, purchasesTotal: 0, expensesTotal: 0, salariesTotal: 0, carExpensesTotal: 0, fruitProfits: {} };
        }
        weeklyData[week].salesTotal += parseFloat(sale.amount || 0);
      });
    }

    if (Array.isArray(data.otherExpenses)) {
      data.otherExpenses.forEach(expense => {
        const week = getWeekKey(expense.date);
        if (!week) return;
        if (!weeklyData[week]) {
          weeklyData[week] = { week, salesTotal: 0, purchasesTotal: 0, expensesTotal: 0, salariesTotal: 0, carExpensesTotal: 0, fruitProfits: {} };
        }
        weeklyData[week].expensesTotal += parseFloat(expense.amount || 0);
      });
    }

    if (Array.isArray(data.salaries)) {
      data.salaries.forEach(salary => {
        const week = getWeekKey(salary.date);
        if (!week) return;
        if (!weeklyData[week]) {
          weeklyData[week] = { week, salesTotal: 0, purchasesTotal: 0, expensesTotal: 0, salariesTotal: 0, carExpensesTotal: 0, fruitProfits: {} };
        }
        weeklyData[week].salariesTotal += parseFloat(salary.amount || 0);
      });
    }

    if (Array.isArray(data.carExpenses)) {
      data.carExpenses.forEach(expense => {
        const week = getWeekKey(expense.date);
        if (!week) return;
        if (!weeklyData[week]) {
          weeklyData[week] = { week, salesTotal: 0, purchasesTotal: 0, expensesTotal: 0, salariesTotal: 0, carExpensesTotal: 0, fruitProfits: {} };
        }
        weeklyData[week].carExpensesTotal += parseFloat(expense.amount || 0);
      });
    }

    const result = Object.values(weeklyData).map(item => ({
      ...item,
      profitLoss: item.salesTotal - item.purchasesTotal - item.expensesTotal - item.salariesTotal - item.carExpensesTotal
    }));

    return result.sort((a, b) => b.week.localeCompare(a.week));
  };

  const calculateMonthlySummaries = () => {
    const monthlyData = {};
    const getMonthKey = (dateStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (isNaN(d)) return null;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    if (Array.isArray(data.purchases)) {
      data.purchases.forEach(purchase => {
        const month = getMonthKey(purchase.date);
        if (!month) return;
        if (!monthlyData[month]) {
          monthlyData[month] = { month, salesTotal: 0, purchasesTotal: 0, expensesTotal: 0, salariesTotal: 0, carExpensesTotal: 0 };
        }
        monthlyData[month].purchasesTotal += parseFloat(purchase.totalAmount || purchase.amount || 0);
      });
    }

    if (Array.isArray(data.sales)) {
      data.sales.forEach(sale => {
        const month = getMonthKey(sale.date || sale.sale_date);
        if (!month) return;
        if (!monthlyData[month]) {
          monthlyData[month] = { month, salesTotal: 0, purchasesTotal: 0, expensesTotal: 0, salariesTotal: 0, carExpensesTotal: 0 };
        }
        monthlyData[month].salesTotal += parseFloat(sale.amount || 0);
      });
    }

    if (Array.isArray(data.otherExpenses)) {
      data.otherExpenses.forEach(expense => {
        const month = getMonthKey(expense.date);
        if (!month) return;
        if (!monthlyData[month]) {
          monthlyData[month] = { month, salesTotal: 0, purchasesTotal: 0, expensesTotal: 0, salariesTotal: 0, carExpensesTotal: 0 };
        }
        monthlyData[month].expensesTotal += parseFloat(expense.amount || 0);
      });
    }

    if (Array.isArray(data.salaries)) {
      data.salaries.forEach(salary => {
        const month = getMonthKey(salary.date);
        if (!month) return;
        if (!monthlyData[month]) {
          monthlyData[month] = { month, salesTotal: 0, purchasesTotal: 0, expensesTotal: 0, salariesTotal: 0, carExpensesTotal: 0 };
        }
        monthlyData[month].salariesTotal += parseFloat(salary.amount || 0);
      });
    }

    if (Array.isArray(data.carExpenses)) {
      data.carExpenses.forEach(expense => {
        const month = getMonthKey(expense.date);
        if (!month) return;
        if (!monthlyData[month]) {
          monthlyData[month] = { month, salesTotal: 0, purchasesTotal: 0, expensesTotal: 0, salariesTotal: 0, carExpensesTotal: 0 };
        }
        monthlyData[month].carExpensesTotal += parseFloat(expense.amount || 0);
      });
    }

    const result = Object.values(monthlyData).map(item => ({
      ...item,
      profitLoss: item.salesTotal - item.purchasesTotal - item.expensesTotal - item.salariesTotal - item.carExpensesTotal
    }));

    return result.sort((a, b) => b.month.localeCompare(a.month));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes('Authentication required') || error.includes('Access denied');
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger d-flex align-items-center justify-content-between">
          <div>
            <strong>{error}</strong>
            {isAuthError && (
              <div className="mt-2">
                <small className="text-muted">Demo credentials: ceo@fruittrack.com / password123</small>
              </div>
            )}
          </div>
          <div className="d-flex gap-2">
            {isAuthError && (
              <button className="btn btn-sm btn-primary" onClick={() => window.location.href = '/login'}>Go to Login</button>
            )}
            <button className="btn btn-sm btn-outline-danger" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const businessMetrics = calculateBusinessMetrics();
  const fruitProfitability = calculateFruitProfitability();
  const expenseBreakdown = calculateExpenseBreakdown();
  const spoligeByFruit = calculateSpoligeByFruit();
  const monthlySummaries = calculateMonthlySummaries();
  const weeklySummaries = calculateWeeklySummaries();

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Authentication required. Please log in to download reports.');
        return;
      }

      const response = await fetch('/api/reports/weekly/pdf', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to generate PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `weekly-reports-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0">Business Analytics Dashboard</h1>
          <p className="text-muted">Comprehensive analysis of your business performance</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-primary" onClick={handleDownloadPDF} disabled={loading}>
            <i className="bi bi-download me-2"></i>Download Weekly Reports PDF
          </button>
          <select className="form-select" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
          <select className="form-select" value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
            <option value="revenue">Revenue</option>
            <option value="profit">Profit</option>
            <option value="quantity">Quantity</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <DollarSign className="text-success" size={24} />
              </div>
              <h6 className="text-muted">Total Revenue</h6>
              <h3 className="text-success mb-0">{formatCurrency(businessMetrics.totalRevenue)}</h3>
              <small className="text-muted">All time</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <TrendingUp className="text-primary" size={24} />
              </div>
              <h6 className="text-muted">Total Profit</h6>
              <h3 className={businessMetrics.totalProfit >= 0 ? 'text-success' : 'text-danger'} mb-0>
                {formatCurrency(businessMetrics.totalProfit)}
              </h3>
              <small className="text-muted">{businessMetrics.profitMargin.toFixed(1)}% margin</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <Package className="text-info" size={24} />
              </div>
              <h6 className="text-muted">Total Sales Volume</h6>
              <h3 className="text-info mb-0">{businessMetrics.totalQuantity.toFixed(1)} kg</h3>
              <small className="text-muted">All fruits combined</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <Users className="text-warning" size={24} />
              </div>
              <h6 className="text-muted">Active Users</h6>
              <h3 className="text-warning mb-0">{data.users.length}</h3>
              <small className="text-muted">Registered users</small>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Fruit Profitability</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fruitProfitability.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="totalProfit"
                    nameKey="fruitType"
                  >
                    {fruitProfitability.slice(0, 8).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 - Most Spoiled Fruits */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Most Spoiled Fruits (Bar Chart)</h5>
            </div>
            <div className="card-body">
              {spoligeByFruit.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={spoligeByFruit.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis type="category" dataKey="fruitType" width={120} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="totalAmount" fill="#FF8042" name="Spoilage Amount" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  <p>No spoilage data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Spoilage by Fruit (Pie Chart)</h5>
            </div>
            <div className="card-body">
              {spoligeByFruit.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={spoligeByFruit.slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="totalAmount"
                      nameKey="fruitType"
                      label={({ fruitType, percent }) => `${fruitType} ${(percent * 100).toFixed(0)}%`}
                    >
                      {spoligeByFruit.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted py-5">
                  <p>No spoilage data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Top Performing Fruits</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={fruitProfitability.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fruitType" angle={-45} textAnchor="end" height={100} />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="totalProfit" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white">
              <h5 className="mb-0">Expense Breakdown</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="amount"
                    label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <h5 className="mb-0">Detailed Fruit Analysis</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Fruit Type</th>
                  <th>Qty Purchased</th>
                  <th>Amt Purchased</th>
                  <th>Qty Sold</th>
                  <th>Amt Sold</th>
                  <th>Profit</th>
                  <th>Margin</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {fruitProfitability.map((fruit, index) => (
                  <tr key={fruit.fruitType}>
                    <td>
                      <span className={index < 3 ? 'text-warning fw-bold' : 'text-muted'}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </span>
                    </td>
                    <td><strong>{fruit.fruitType}</strong></td>
                    <td>{fruit.purchasedQuantity.toFixed(1)} kg</td>
                    <td>{formatCurrency(fruit.purchasedAmount)}</td>
                    <td>{fruit.soldQuantity.toFixed(1)} kg</td>
                    <td>{formatCurrency(fruit.soldAmount)}</td>
                    <td className={fruit.totalProfit >= 0 ? 'text-success' : 'text-danger'}>{formatCurrency(fruit.totalProfit)}</td>
                    <td>
                      <span className={`badge ${fruit.profitMargin >= 20 ? 'bg-success' : fruit.profitMargin >= 10 ? 'bg-warning' : 'bg-danger'}`}>
                        {fruit.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      {fruit.totalProfit > 10000 ? (
                        <TrendingUp className="text-success" size={20} />
                      ) : fruit.totalProfit > 0 ? (
                        <Activity className="text-warning" size={20} />
                      ) : (
                        <TrendingDown className="text-danger" size={20} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Weekly Reports Table */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">Weekly Reports & Best Fruit Performance</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Total Purchases</th>
                  <th>Total Sales</th>
                  <th>Total Expenses</th>
                  <th>Total Salaries</th>
                  <th>Total Car Expenses</th>
                  <th>Profit / Loss</th>
                </tr>
              </thead>
              <tbody>
                {weeklySummaries.map((item) => (
                  <tr key={item.week}>
                    <td>{item.week}</td>
                    <td>{formatCurrency(item.purchasesTotal)}</td>
                    <td>{formatCurrency(item.salesTotal)}</td>
                    <td>{formatCurrency(item.expensesTotal)}</td>
                    <td>{formatCurrency(item.salariesTotal)}</td>
                    <td>{formatCurrency(item.carExpensesTotal)}</td>
                    <td className={item.profitLoss >= 0 ? 'text-success' : 'text-danger'}>{formatCurrency(item.profitLoss)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="card border-0 shadow-sm mt-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">Monthly Summary</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Purchases</th>
                  <th>Total Sales</th>
                  <th>Total Expenses</th>
                  <th>Total Salaries</th>
                  <th>Total Car Expenses</th>
                  <th>Profit / Loss</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummaries.map((item) => (
                  <tr key={item.month}>
                    <td>{item.month}</td>
                    <td>{formatCurrency(item.purchasesTotal)}</td>
                    <td>{formatCurrency(item.salesTotal)}</td>
                    <td>{formatCurrency(item.expensesTotal)}</td>
                    <td>{formatCurrency(item.salariesTotal)}</td>
                    <td>{formatCurrency(item.carExpensesTotal)}</td>
                    <td className={item.profitLoss >= 0 ? 'text-success' : 'text-danger'}>{formatCurrency(item.profitLoss)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsTabAnalytics;
