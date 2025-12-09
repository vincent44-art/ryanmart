
import React from 'react';

const SalesTableHeader = ({ userSales, clearAllSales }) => {
  return (
    <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
      <h5 className="mb-0">My Sales History</h5>
    </div>
  );
};

export default SalesTableHeader;
