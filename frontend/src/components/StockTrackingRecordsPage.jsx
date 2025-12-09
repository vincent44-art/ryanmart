import React from 'react';
import { useNavigate } from 'react-router-dom';

const StockTrackingRecordsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container py-4">
      <div className="row mb-3">
        <div className="col-12 d-flex justify-content-start">
          <button className="btn btn-secondary" onClick={() => navigate('/ceo/dashboard')}>
            &larr; Back to CEO Dashboard
          </button>
        </div>
      </div>
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-center">Stock Tracking Overview</h2>
        </div>
      </div>
      <div className="row">
        <div className="col-12">
          <div className="card shadow-lg border-0">
            <div className="card-header bg-primary text-white">
              <h5><i className="bi bi-table me-2"></i>Stock Tracking Overview</h5>
            </div>
            <div className="card-body text-center">
              <h3>Coming Soon</h3>
              <p>The Stock Tracking Overview feature is under development and will be available soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockTrackingRecordsPage;
