import React, { useState, useEffect } from 'react';
import { fetchSalaries, fetchUsers, deleteSalary } from './apiHelpers';
import SalaryFormModal from './SalaryFormModal';

const SalaryManagementTab = () => {
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [salaries, setSalaries] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // Fetch all data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const [salariesRes, usersRes] = await Promise.all([
          fetchSalaries(token),
          fetchUsers(token)
        ]);
        console.log('Loaded users:', usersRes.data);
        console.log('Loaded salaries:', salariesRes.data);
        const usersData = usersRes.data?.data || [];
        setSalaries(salariesRes.data?.data || []);
        setUsers(usersData);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load data. Please try again.');
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Salary Payment History</h2>
        <button
          type="button"
          className="btn btn-primary shadow-sm px-4 py-2 fw-bold"
          style={{ borderRadius: '8px', fontSize: '1rem', letterSpacing: '0.5px' }}
          onClick={() => setShowSalaryModal(true)}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Add Salary Record
        </button>
      </div>
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          {error}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
          />
        </div>
      )}
      <div className="card shadow-sm">
        <div className="card-header bg-light">
          <h5 className="mb-0">Employee Salary Overview</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaries.length > 0 ? (
                  salaries.sort((a, b) => new Date(b.date) - new Date(a.date)).map(salary => {
                    const user = users.find(u => u.id === salary.user_id);
                    return (
                      <tr key={salary.id}>
                        <td>{user ? user.name : 'Unknown'}</td>
                        <td>{formatCurrency(salary.amount)}</td>
                        <td>{new Date(salary.date).toLocaleDateString()}</td>
                        <td>{salary.description || '-'}</td>
                        <td>
                          <span className={`badge ${salary.is_paid ? 'bg-success' : 'bg-warning'}`}>
                            {salary.is_paid ? 'PAID' : 'PENDING'}
                          </span>
                        </td>
                        <td>
                          <button className={`btn btn-sm ${salary.is_paid ? 'btn-warning' : 'btn-success'} me-2`}
                            onClick={async () => {
                              await fetch('/api/salary-payments/' + salary.id + '/toggle-status', {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                              });
                              // Refresh salaries
                              const token = localStorage.getItem('access_token');
                              const salariesRes = await fetchSalaries(token);
                              setSalaries(salariesRes.data?.data || []);
                            }}>
                            {salary.is_paid ? 'Mark Pending' : 'Mark Paid'}
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={async () => {
                              await deleteSalary(salary.id);
                              const token = localStorage.getItem('access_token');
                              const salariesRes = await fetchSalaries(token);
                              setSalaries(salariesRes.data?.data || []);
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No salary records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <SalaryFormModal
        show={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
          onSave={async (salaryData) => {
          await fetch('/api/salaries', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(salaryData)
          });
          setShowSalaryModal(false);
          // Refresh salaries
          const token = localStorage.getItem('access_token');
          const salariesRes = await fetchSalaries(token);
          setSalaries(salariesRes.data || []);
        }}
        users={users}
      />
    </div>
  );
};

export default SalaryManagementTab;