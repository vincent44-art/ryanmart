import React from 'react';


const PerformanceOverview = ({ data }) => {
  // Debug: Log incoming data
  try {
    console.log('PerformanceOverview data prop:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.log('PerformanceOverview data prop (raw):', data);
  }
  // Defensive: always provide default values for all expected fields
  const stats = data && typeof data === 'object' && data.stats ? data.stats : {
    totalUsers: 0,
    totalInventoryItems: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalCarExpenses: 0,
    totalOtherExpenses: 0,
    totalSalaries: 0,
    netProfit: 0,
    profitMargin: 0
  };
  const fruitPerformance = Array.isArray(data?.fruitPerformance) ? data.fruitPerformance : [];
  const monthlyData = Array.isArray(data?.monthlyData) ? data.monthlyData : [];
  const weeklyData = Array.isArray(data?.weeklyData) ? data.weeklyData : [];

  // If all are empty, show a message
  if (
    (!stats || Object.values(stats).every(v => v === 0)) &&
    fruitPerformance.length === 0 &&
    monthlyData.length === 0 &&
    weeklyData.length === 0
  ) {
    return (
      <div className="text-center py-5">
        <h4>No Data Available</h4>
        <p className="text-muted">No performance data could be loaded.</p>
      </div>
    );
  }
  const getPerformerLabel = (fruit, best, worst) => {
    if (!fruit || !best || !worst) return null;
    if (fruit.fruitType === best.fruitType) return <span className="badge bg-success ms-2">Best</span>;
    if (fruit.fruitType === worst.fruitType) return <span className="badge bg-danger ms-2">Worst</span>;
    return null;
  };

  // Always render the dashboard tables, even if empty

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'KES 0.00';
    }
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const totalExpenses = (stats.totalPurchases || 0) + 
                       (stats.totalCarExpenses || 0) + 
                       (stats.totalOtherExpenses || 0) + 
                       (stats.totalSalaries || 0);

  // expenseBreakdown removed (was only used for removed charts)

  const bestPerformingFruit = fruitPerformance[0] || null;

  // Ensure monthlyData has profitOrLoss for each month
  const monthlyDataWithProfit = monthlyData.map(month => ({
    ...month,
    profitOrLoss: typeof month.profitOrLoss === 'number'
      ? month.profitOrLoss
      : (month.sales || 0) - ((month.purchases || 0) + (month.expenses || 0) + (month.salaries || 0))
  }));

  return (
    <div className="container-fluid py-4">
      <div className="row mb-4">
        <div className="col-12">
          <h2>Business Performance Dashboard</h2>
          <p className="text-muted">Key metrics and financial overview</p>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="row mb-4 g-3">
        <div className="col-md-3">
          <div className="card shadow-sm border-success">
            <div className="card-body text-center">
              <h5 className="text-muted">Total Revenue</h5>
              <h3 className="text-success">{formatCurrency(stats.totalSales)}</h3>
              <small className="text-muted">All-time sales</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-danger">
            <div className="card-body text-center">
              <h5 className="text-muted">Total Expenses</h5>
              <h3 className="text-danger">{formatCurrency(totalExpenses)}</h3>
              <small className="text-muted">All operational costs</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-primary">
            <div className="card-body text-center">
              <h5 className="text-muted">Net Profit</h5>
              <h3 className={stats.netProfit >= 0 ? 'text-success' : 'text-danger'}>
                {formatCurrency(stats.netProfit)}
              </h3>
              <small className="text-muted">Revenue - Expenses</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-info">
            <div className="card-body text-center">
              <h5 className="text-muted">Best Product</h5>
              <h4 className="text-primary">{bestPerformingFruit?.fruitType || 'N/A'}</h4>
              <small className="text-muted">
                {bestPerformingFruit ? formatCurrency(bestPerformingFruit.profit) : 'No data'}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Performance Table (ALWAYS VISIBLE) */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Monthly Performance</h5>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Month</th>
                      <th>Sales</th>
                      <th>Purchases</th>
                      <th>Expenses</th>
                      <th>Profit/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyDataWithProfit.map((month, idx) => (
                      <tr key={month.month}>
                        <td>{month.month}</td>
                        <td>{formatCurrency(month.sales)}</td>
                        <td>{formatCurrency(month.purchases)}</td>
                        <td>{formatCurrency(month.expenses)}</td>
                        <td className={month.profitOrLoss >= 0 ? 'text-success' : 'text-danger'}>
                          {formatCurrency(month.profitOrLoss)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts removed: replaced with tables for reliability */}
      {/* You can add more summary tables here if needed */}

      {/* Fruit Performance */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Product Performance Analysis</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Product</th>
                      <th>Purchases</th>
                      <th>Sales</th>
                      <th>Profit/Loss</th>
                      <th>Margin</th>
                      <th>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fruitPerformance.map((fruit, index) => (
                      <tr key={fruit.fruitType}>
                        <td>
                          <strong>{fruit.fruitType}</strong>
                          {index === 0 && <span className="badge bg-success ms-2">Top Performer</span>}
                        </td>
                        <td>{formatCurrency(fruit.purchases)}</td>
                        <td>{formatCurrency(fruit.sales)}</td>
                        <td className={fruit.profit >= 0 ? 'text-success' : 'text-danger'}>
                          {formatCurrency(fruit.profit)}
                        </td>
                        <td className={fruit.profitMargin >= 0 ? 'text-success' : 'text-danger'}>
                          {fruit.profitMargin.toFixed(1)}%
                        </td>
                        <td>
                          <div className="progress" style={{height: '20px'}}>
                            <div 
                              className={`progress-bar ${fruit.profit >= 0 ? 'bg-success' : 'bg-danger'}`}
                              style={{width: `${Math.min(Math.abs(fruit.profitMargin), 100)}%`}}
                              role="progressbar"
                              aria-valuenow={Math.abs(fruit.profitMargin)}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            >
                              {fruit.profitMargin.toFixed(1)}%
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Performance Table */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Weekly Fruit Performance</h5>
              <div className="table-responsive" style={{maxHeight: '400px', overflowY: 'auto'}}>
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Week</th>
                      <th>Fruit</th>
                      <th>Sales</th>
                      <th>Purchases</th>
                      <th>Car Expenses</th>
                      <th>Other Expenses</th>
                      <th>Profit/Loss</th>
                      <th>Margin</th>
                      <th>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyData.length === 0 && (
                      <tr><td colSpan="9" className="text-center text-muted">No weekly data</td></tr>
                    )}
                    {weeklyData.map((week) => (
                      week.fruits.map((fruit, idx) => (
                        <tr key={week.week + '-' + fruit.fruitType}>
                          {idx === 0 && (
                            <td rowSpan={week.fruits.length} style={{verticalAlign: 'middle', fontWeight: 'bold'}}>
                              Week {week.week}<br/>
                              <small>{week.start} - {week.end}</small>
                              <div className="mt-2">
                                <span className="badge bg-success">Best: {week.bestPerformer?.fruitType || 'N/A'}</span><br/>
                                <span className="badge bg-danger mt-1">Worst: {week.worstPerformer?.fruitType || 'N/A'}</span>
                              </div>
                            </td>
                          )}
                          <td>{fruit.fruitType} {getPerformerLabel(fruit, week.bestPerformer, week.worstPerformer)}</td>
                          <td>{formatCurrency(fruit.sales)}</td>
                          <td>{formatCurrency(fruit.purchases)}</td>
                          <td>{formatCurrency(fruit.carExpenses)}</td>
                          <td>{formatCurrency(fruit.otherExpenses)}</td>
                          <td className={fruit.profit >= 0 ? 'text-success' : 'text-danger'}>{formatCurrency(fruit.profit)}</td>
                          <td className={fruit.profitMargin >= 0 ? 'text-success' : 'text-danger'}>{fruit.profitMargin.toFixed(1)}%</td>
                          <td>{fruit.isLoss ? <span className="badge bg-danger">Loss</span> : <span className="badge bg-success">Profit</span>}</td>
                        </tr>
                      ))
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fruit Profitability Chart removed: all data now in tables above */}
    </div>
  );
};

export default PerformanceOverview;
