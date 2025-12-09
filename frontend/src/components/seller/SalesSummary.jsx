
import React from 'react';

const SalesSummary = ({ userSales, formatKenyanCurrency }) => {
  if (userSales.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 p-3 bg-light rounded">
      <div className="row text-center">
        <div className="col-6">
          <h6 className="text-muted mb-1">Total Sales</h6>
          <h5 className="text-primary mb-0">{userSales.length}</h5>
        </div>
        <div className="col-6">
          <h6 className="text-muted mb-1">Total Revenue</h6>
          <h5 className="text-success mb-0">
            {formatKenyanCurrency(
              userSales.reduce((sum, sale) => sum + parseFloat(sale.revenue || 0), 0)
            )}
          </h5>
        </div>
      </div>
    </div>
  );
};

export default SalesSummary;
