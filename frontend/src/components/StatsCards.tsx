import React, { useState, useEffect } from 'react';

//import { fetchStats } from 'http://127.0.0.1:5000/api';
import { fetchStats } from './apiHelpers';

interface StatsData {
  totalPurchases: number;
  totalSales: number;
  netProfit: number;
  profitMargin: number;
}

const StatsCards: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetchStats();
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('Failed to load business statistics');
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Set up polling for real-time updates (optional)
    const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="row g-4 mb-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="col-md-6 col-lg-3">
            <div className="stats-card text-center p-3 bg-light rounded">
              <div className="display-6 text-secondary mb-2">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
              <h3 className="h5 mb-1 text-muted">Loading...</h3>
              <p className="h4 text-muted mb-0">--</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger mb-4">
        <i className="bi bi-exclamation-triangle me-2"></i>
        {error}
        <button 
          className="btn btn-sm btn-outline-danger ms-3"
          onClick={() => window.location.reload()}
        >
          <i className="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="row g-4 mb-4">
      <div className="col-md-6 col-lg-3">
        <div className="stats-card text-center p-3 bg-white shadow-sm rounded">
          <div className="display-6 text-primary mb-2">
            <i className="bi bi-cart-plus"></i>
          </div>
          <h3 className="h5 mb-1">Total Purchases</h3>
          <p className="h4 text-success mb-0">{formatCurrency(stats.totalPurchases)}</p>
          <small className="text-muted">Inventory costs</small>
        </div>
      </div>
      
      <div className="col-md-6 col-lg-3">
        <div className="stats-card text-center p-3 bg-white shadow-sm rounded">
          <div className="display-6 text-success mb-2">
            <i className="bi bi-graph-up"></i>
          </div>
          <h3 className="h5 mb-1">Total Sales</h3>
          <p className="h4 text-success mb-0">{formatCurrency(stats.totalSales)}</p>
          <small className="text-muted">Gross revenue</small>
        </div>
      </div>
      
      <div className="col-md-6 col-lg-3">
        <div className="stats-card text-center p-3 bg-white shadow-sm rounded">
          <div className="display-6 text-warning mb-2">
            <i className="bi bi-currency-dollar"></i>
          </div>
          <h3 className="h5 mb-1">Net Profit</h3>
          <p className={`h4 mb-0 ${stats.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(stats.netProfit)}
          </p>
          <small className="text-muted">After expenses</small>
        </div>
      </div>
      
      <div className="col-md-6 col-lg-3">
        <div className="stats-card text-center p-3 bg-white shadow-sm rounded">
          <div className="display-6 text-info mb-2">
            <i className="bi bi-percent"></i>
          </div>
          <h3 className="h5 mb-1">Profit Margin</h3>
          <p className={`h4 mb-0 ${stats.profitMargin >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatPercentage(stats.profitMargin)}
          </p>
          <small className="text-muted">Efficiency ratio</small>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;