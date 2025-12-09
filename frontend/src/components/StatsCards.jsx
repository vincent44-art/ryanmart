import React from 'react';

const StatsCards = ({ stats }) => {

  // Defensive: provide default values for all stats fields
  const safeStats = {
    totalPurchases: stats?.totalPurchases ?? 0,
    totalSales: stats?.totalSales ?? 0,
    netProfit: stats?.netProfit ?? 0,
    profitMargin: typeof stats?.profitMargin === 'number' && !isNaN(stats.profitMargin) ? stats.profitMargin : 0
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount || 0);
  };

  if (!stats) return null;

  return (
    <div className="row g-4 mb-4">
      <div className="col-md-6 col-lg-3">
        <div className="stats-card text-center p-3 shadow-sm rounded">
          <div className="display-6 text-primary mb-2">
            <i className="bi bi-cart-plus"></i>
          </div>
          <h3 className="h5 mb-1">Total Purchases</h3>
          <p className="h4 text-success mb-0">{formatCurrency(safeStats.totalPurchases)}</p>
          <small className="text-muted">All inventory purchases</small>
        </div>
      </div>

      <div className="col-md-6 col-lg-3">
        <div className="stats-card text-center p-3 shadow-sm rounded">
          <div className="display-6 text-success mb-2">
            <i className="bi bi-graph-up"></i>
          </div>
          <h3 className="h5 mb-1">Total Sales</h3>
          <p className="h4 text-success mb-0">{formatCurrency(safeStats.totalSales)}</p>
          <small className="text-muted">Gross revenue</small>
        </div>
      </div>
      
      <div className="col-md-6 col-lg-3">
        <div className="stats-card text-center p-3 shadow-sm rounded">
          <div className="display-6 text-warning mb-2">
            <i className="bi bi-currency-dollar"></i>
          </div>
          <h3 className="h5 mb-1">Net Profit</h3>
          <p className={`h4 mb-0 ${safeStats.netProfit >= 0 ? 'text-success' : 'text-danger'}`}> 
            {formatCurrency(safeStats.netProfit)}
          </p>
          <small className="text-muted">After all expenses</small>
        </div>
      </div>
      
      <div className="col-md-6 col-lg-3">
        <div className="stats-card text-center p-3 shadow-sm rounded">
          <div className="display-6 text-info mb-2">
            <i className="bi bi-percent"></i>
          </div>
          <h3 className="h5 mb-1">Profit Margin</h3>
          <p className={`h4 mb-0 ${safeStats.profitMargin >= 0 ? 'text-success' : 'text-danger'}`}> 
            {safeStats.profitMargin.toFixed(1)}%
          </p>
          <small className="text-muted">Profit to sales ratio</small>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;