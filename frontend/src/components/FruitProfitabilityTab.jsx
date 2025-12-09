import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchSales, fetchPurchases } from './apiHelpers';

const FruitProfitabilityTab = () => {
  const [sales, setSales] = useState([]);
    // const [purchases, setPurchases] = useState([]); // Used below, keep declaration
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estimated cost per unit for different fruits (in KES)
  const estimatedCosts = {
    'Sweet banana': 50,
    'Kampala': 45,
    'Cavendish': 55,
    'Plantain': 40,
    'Matoke': 35,
    'American sweet potatoes': 60,
    'White sweet potatoes': 55,
    'Red sweet potatoes': 65,
    'Local Avocados': 80,
    'Hass Avocados': 120,
    'Oranges': 70,
    'Pixie': 75,
    'Lemons': 85
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [salesRes] = await Promise.all([
          fetchSales(),
          fetchPurchases()
        ]);

        setSales(salesRes.data || []);
      } catch (error) {
        console.error('Failed to load data:', error);
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
    }).format(amount);
  };

  // Calculate fruit profitability
  const calculateFruitMetrics = () => {
    const fruitMetrics = {};

  // Process sales data
  (Array.isArray(sales) ? sales : []).forEach(sale => {
      const fruitType = sale.fruit_type || sale.fruitType;
      const revenue = parseFloat(sale.revenue || 0);
      const quantity = parseFloat(sale.quantity || sale.quantitySold || 0);

      if (!fruitMetrics[fruitType]) {
        fruitMetrics[fruitType] = {
          fruitType,
          totalRevenue: 0,
          totalQuantity: 0,
          totalCost: 0,
          salesCount: 0
        };
      }

      fruitMetrics[fruitType].totalRevenue += revenue;
      fruitMetrics[fruitType].totalQuantity += quantity;
      fruitMetrics[fruitType].salesCount += 1;
    });

    // Calculate costs and profits
    Object.keys(fruitMetrics).forEach(fruitType => {
      const metrics = fruitMetrics[fruitType];
      const costPerUnit = estimatedCosts[fruitType] || 50; // Default cost if not found
      metrics.totalCost = metrics.totalQuantity * costPerUnit;
      metrics.totalProfit = metrics.totalRevenue - metrics.totalCost;
      metrics.profitMargin = metrics.totalRevenue > 0 ? (metrics.totalProfit / metrics.totalRevenue) * 100 : 0;
      metrics.avgRevenuePerUnit = metrics.totalQuantity > 0 ? metrics.totalRevenue / metrics.totalQuantity : 0;
    });

    return fruitMetrics;
  };

  const fruitMetrics = calculateFruitMetrics();
  const fruitList = Object.values(fruitMetrics);

  // Sort by profitability (best to worst)
  const sortedFruits = fruitList.sort((a, b) => b.totalProfit - a.totalProfit);

  const filteredFruits = sortedFruits.filter(fruit =>
    fruit.fruitType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProfitabilityIcon = (profit) => {
    if (profit > 10000) return <TrendingUp className="text-success" size={20} />;
    if (profit > 0) return <Minus className="text-warning" size={20} />;
    return <TrendingDown className="text-danger" size={20} />;
  };

  const getProfitabilityBadge = (profit) => {
    if (profit > 10000) return 'success';
    if (profit > 0) return 'warning';
    return 'danger';
  };

  const getPerformanceRank = (index) => {
    if (index === 0) return { rank: '🥇', color: 'text-warning' };
    if (index === 1) return { rank: '🥈', color: 'text-secondary' };
    if (index === 2) return { rank: '🥉', color: 'text-danger' };
    return { rank: `#${index + 1}`, color: 'text-muted' };
  };

  // Summary statistics
  const totalRevenue = fruitList.reduce((sum, fruit) => sum + fruit.totalRevenue, 0);
  const totalProfit = fruitList.reduce((sum, fruit) => sum + fruit.totalProfit, 0);
  const totalQuantity = fruitList.reduce((sum, fruit) => sum + fruit.totalQuantity, 0);
  const avgProfitMargin = fruitList.length > 0 ? fruitList.reduce((sum, fruit) => sum + fruit.profitMargin, 0) / fruitList.length : 0;

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Fruit Profitability Analysis</h2>
        <div className="text-muted">
          <small>Showing {filteredFruits.length} of {fruitList.length} fruits</small>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="text-muted">Total Revenue</h6>
              <h4 className="text-success">{formatCurrency(totalRevenue)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="text-muted">Total Profit</h6>
              <h4 className={totalProfit >= 0 ? 'text-success' : 'text-danger'}>
                {formatCurrency(totalProfit)}
              </h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="text-muted">Total Quantity</h6>
              <h4 className="text-primary">{totalQuantity.toFixed(1)} kg</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="text-muted">Avg Margin</h6>
              <h4 className={avgProfitMargin >= 20 ? 'text-success' : avgProfitMargin >= 10 ? 'text-warning' : 'text-danger'}>
                {avgProfitMargin.toFixed(1)}%
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card card-custom mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="position-relative flex-grow-1">
              <Search className="position-absolute" style={{left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#6c757d'}} />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search fruits..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fruit Performance Table */}
      <div className="card card-custom">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Fruit Type</th>
                  <th>Performance</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                  <th>Est. Cost</th>
  {/* Removed call to setPurchases (no longer defined) */}
                  <th>Margin</th>
                  <th>Avg Price/Unit</th>
                </tr>
              </thead>
              <tbody>
                {filteredFruits.map((fruit, index) => {
                  const rank = getPerformanceRank(index);
                  return (
                    <tr key={fruit.fruitType}>
                      <td>
                        <span className={rank.color}>{rank.rank}</span>
                      </td>
                      <td>
                        <strong>{fruit.fruitType}</strong>
                      </td>
                      <td>
                        <span className={`badge bg-${getProfitabilityBadge(fruit.totalProfit)}`}>
                          {getProfitabilityIcon(fruit.totalProfit)}
                          <span className="ms-1">
                            {fruit.totalProfit > 10000 ? 'High' : fruit.totalProfit > 0 ? 'Medium' : 'Low'}
                          </span>
                        </span>
                      </td>
                      <td>{fruit.totalQuantity.toFixed(1)} kg</td>
                      <td>{formatCurrency(fruit.totalRevenue)}</td>
                      <td>{formatCurrency(fruit.totalCost)}</td>
                      <td className={fruit.totalProfit >= 0 ? 'text-success' : 'text-danger'}>
                        {formatCurrency(fruit.totalProfit)}
                      </td>
                      <td>
                        <span className={`badge ${fruit.profitMargin >= 20 ? 'bg-success' : fruit.profitMargin >= 10 ? 'bg-warning' : 'bg-danger'}`}>
                          {fruit.profitMargin.toFixed(1)}%
                        </span>
                      </td>
                      <td>{formatCurrency(fruit.avgRevenuePerUnit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredFruits.length === 0 && (
            <div className="text-center py-4">
              {fruitList.length === 0 ? 'No fruit data available' : 'No matching fruits found'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FruitProfitabilityTab;
