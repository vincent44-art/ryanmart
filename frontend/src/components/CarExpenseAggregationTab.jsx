import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

// Use relative API paths — backend determined by REACT_APP_API_BASE_URL env var
const API_ENDPOINT = '/api/car-expenses';

const fetchCarExpenses = async () => {
  const token = localStorage.getItem('access_token');
  const res = await fetch(API_ENDPOINT, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) throw new Error('Failed to fetch car expenses');
  return await res.json();
};

const CarExpenseAggregationTab = (props) => {
  const [expenses, setExpenses] = useState(Array.isArray(props.data) ? props.data : []);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (Array.isArray(props.data)) {
      setExpenses(props.data);
      setLoading(false);
    } else {
      const loadExpenses = async () => {
        try {
          const response = await fetchCarExpenses();
          setExpenses(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
          console.error('Failed to fetch car expenses:', error);
        } finally {
          setLoading(false);
        }
      };
      loadExpenses();
    }
  }, [props.data]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);

  // Aggregate expenses by car type
  const aggregateByCarType = () => {
    const carTypeExpenses = {};

    expenses.forEach(expense => {
      const carType = expense.carType || expense.car_type || 'Unknown';
      const amount = parseFloat(expense.amount || 0);

      if (!carTypeExpenses[carType]) {
        carTypeExpenses[carType] = {
          carType,
          totalExpenses: 0,
          expenseCount: 0,
          categories: {},
          expenses: []
        };
      }

      carTypeExpenses[carType].totalExpenses += amount;
      carTypeExpenses[carType].expenseCount += 1;
      carTypeExpenses[carType].expenses.push(expense);

      // Categorize by expense type
      const category = expense.type || expense.category || 'other';
      if (!carTypeExpenses[carType].categories[category]) {
        carTypeExpenses[carType].categories[category] = 0;
      }
      carTypeExpenses[carType].categories[category] += amount;
    });

    return Object.values(carTypeExpenses);
  };

  const carTypeData = aggregateByCarType();

  // Sort by total expenses (most to least expensive)
  const sortedCarTypes = carTypeData.sort((a, b) => b.totalExpenses - a.totalExpenses);

  const filteredCarTypes = sortedCarTypes.filter(carType =>
    carType.carType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getExpenseIcon = (amount) => {
    if (amount > 50000) return <AlertTriangle className="text-danger" size={20} />;
    if (amount > 25000) return <TrendingUp className="text-warning" size={20} />;
    return <DollarSign className="text-success" size={20} />;
  };

  const getExpenseLevel = (amount) => {
    if (amount > 50000) return { level: 'High', badge: 'danger' };
    if (amount > 25000) return { level: 'Medium', badge: 'warning' };
    return { level: 'Low', badge: 'success' };
  };

  // Summary statistics
  const totalExpenses = carTypeData.reduce((sum, car) => sum + car.totalExpenses, 0);
  const totalTransactions = carTypeData.reduce((sum, car) => sum + car.expenseCount, 0);
  const avgExpensePerCar = carTypeData.length > 0 ? totalExpenses / carTypeData.length : 0;

  // Category breakdown
  const categoryTotals = {};
  carTypeData.forEach(car => {
    Object.entries(car.categories).forEach(([category, amount]) => {
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
    });
  });

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
        <h2>Car Expense Analysis</h2>
        <div className="text-muted">
          <small>Showing {filteredCarTypes.length} of {carTypeData.length} car types</small>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="text-muted">Total Expenses</h6>
              <h4 className="text-danger">{formatCurrency(totalExpenses)}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="text-muted">Total Transactions</h6>
              <h4 className="text-primary">{totalTransactions}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="text-muted">Car Types</h6>
              <h4 className="text-info">{carTypeData.length}</h4>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center">
              <h6 className="text-muted">Avg per Car</h6>
              <h4 className="text-warning">{formatCurrency(avgExpensePerCar)}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="card card-custom mb-4">
          <div className="card-body">
            <h5 className="card-title">Expense Categories</h5>
            <div className="row">
              {Object.entries(categoryTotals).map(([category, amount]) => (
                <div key={category} className="col-md-3 mb-3">
                  <div className="text-center">
                    <div className="h6 mb-1">{category.toUpperCase()}</div>
                    <div className="h5 text-primary">{formatCurrency(amount)}</div>
                    <small className="text-muted">
                      {((amount / totalExpenses) * 100).toFixed(1)}%
                    </small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="card card-custom mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="position-relative flex-grow-1">
              <Search className="position-absolute" style={{left: '12px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#6c757d'}} />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search car types..."
                value={searchTerm}
                onClick={(e) => setSearchTerm(e.target.value)}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Car Type Analysis Table */}
      <div className="card card-custom">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Car Type</th>
                  <th>Expense Level</th>
                  <th>Total Expenses</th>
                  <th>Transactions</th>
                  <th>Avg per Transaction</th>
                  <th>Category Breakdown</th>
                </tr>
              </thead>
              <tbody>
                {filteredCarTypes.map((carType, index) => {
                  const expenseLevel = getExpenseLevel(carType.totalExpenses);
                  return (
                    <tr key={carType.carType}>
                      <td>
                        <strong>#{index + 1}</strong>
                      </td>
                      <td>
                        <strong>{carType.carType}</strong>
                      </td>
                      <td>
                        <span className={`badge bg-${expenseLevel.badge}`}>
                          {getExpenseIcon(carType.totalExpenses)}
                          <span className="ms-1">{expenseLevel.level}</span>
                        </span>
                      </td>
                      <td className="text-danger">
                        <strong>{formatCurrency(carType.totalExpenses)}</strong>
                      </td>
                      <td>{carType.expenseCount}</td>
                      <td>{formatCurrency(carType.totalExpenses / carType.expenseCount)}</td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          {Object.entries(carType.categories).map(([category, amount]) => (
                            <small key={category} className="badge bg-light text-dark">
                              {category}: {formatCurrency(amount)}
                            </small>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredCarTypes.length === 0 && (
            <div className="text-center py-4">
              {carTypeData.length === 0 ? 'No car expense data available' : 'No matching car types found'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarExpenseAggregationTab;
