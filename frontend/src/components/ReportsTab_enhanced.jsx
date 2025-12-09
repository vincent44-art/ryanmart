import React, { useState, useEffect } from 'react';
import {
  fetchInventory,
  fetchStockMovements,
  fetchPurchases,
  fetchSales,
  fetchOtherExpenses,
  fetchUsers
} from './apiHelpers';
import UserManagementTab from './UserManagementTab';
import SalesTab from './SalesTab';
import CarExpensesTab from './CarExpensesTab';
import OtherExpensesTab from './OtherExpensesTab';
import SalaryManagementTab from './SalaryManagementTab';
import RoleSeparatedUsers from './RoleSeparatedUsers';
import FruitProfitabilityTab from './FruitProfitabilityTab';
import CarExpenseAggregationTab from './CarExpenseAggregationTab';

const ReportsTab = () => {
  const [data, setData] = useState({
    inventory: [],
    stockMovements: [],
    purchases: [],
    sales: [],
    otherExpenses: [],
    users: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const [
          inventoryRes,
          movementsRes,
          purchasesRes,
          salesRes,
          expensesRes,
          usersRes
        ] = await Promise.all([
          fetchInventory(token),
          fetchStockMovements(token),
          fetchPurchases(),
          fetchSales(),
          fetchOtherExpenses(),
          fetchUsers()
        ]);

        setData({
          inventory: inventoryRes.data || [],
          stockMovements: movementsRes.data || [],
          purchases: purchasesRes.data || [],
          sales: salesRes.data || [],
          otherExpenses: expensesRes.data || [],
          users: usersRes.data || []
        });
      } catch (err) {
        console.error('Failed to load reports data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
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

  return (
    <div>
      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4" id="reportsTab" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className="nav-link active"
            id="users-tab"
            data-bs-toggle="tab"
            data-bs-target="#users"
            type="button"
            role="tab"
            aria-controls="users"
            aria-selected="true"
          >
            <i className="bi bi-people me-2"></i>Users
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className="nav-link"
            id="fruit-tab"
            data-bs-toggle="tab"
            data-bs-target="#fruit"
            type="button"
            role="tab"
            aria-controls="fruit"
            aria-selected="false"
          >
            <i className="bi bi-apple me-2"></i>Fruit
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className="nav-link"
            id="cars-tab"
            data-bs-toggle="tab"
            data-bs-target="#cars"
            type="button"
            role="tab"
            aria-controls="cars"
            aria-selected="false"
          >
            <i className="bi bi-car me-2"></i>Cars
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className="nav-link"
            id="expenses-tab"
            data-bs-toggle="tab"
            data-bs-target="#expenses"
            type="button"
            role="tab"
            aria-controls="expenses"
            aria-selected="false"
          >
            <i className="bi bi-receipt me-2"></i>Other Expenses
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className="nav-link"
            id="accountant-tab"
            data-bs-toggle="tab"
            data-bs-target="#accountant"
            type="button"
            role="tab"
            aria-controls="accountant"
            aria-selected="false"
          >
            <i className="bi bi-calculator me-2"></i>Accountant
          </button>
        </li>
      </ul>

      {/* Tab Content */}
      <div className="tab-content" id="reportsTabContent">
        {/* Users Tab - Enhanced with Role Separation */}
        <div
          className="tab-pane fade show active"
          id="users"
          role="tabpanel"
          aria-labelledby="users-tab"
        >
          <RoleSeparatedUsers data={data.users} />
        </div>

        {/* Fruit Tab - Enhanced with Profitability Analysis */}
        <div
          className="tab-pane fade"
          id="fruit"
          role="tabpanel"
          aria-labelledby="fruit-tab"
        >
          <FruitProfitabilityTab />
        </div>

        {/* Cars Tab - Enhanced with Expense Aggregation */}
        <div
          className="tab-pane fade"
          id="cars"
          role="tabpanel"
          aria-labelledby="cars-tab"
        >
          <CarExpenseAggregationTab data={[]} />
        </div>

        {/* Other Expenses Tab */}
        <div
          className="tab-pane fade"
          id="expenses"
          role="tabpanel"
          aria-labelledby="expenses-tab"
        >
          <OtherExpensesTab />
        </div>

        {/* Accountant Tab */}
        <div
          className="tab-pane fade"
          id="accountant"
          role="tabpanel"
          aria-labelledby="accountant-tab"
        >
          <SalaryManagementTab />
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
