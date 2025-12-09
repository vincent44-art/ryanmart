import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SpoligeTab = ({ data }) => {
  const spolige = Array.isArray(data) ? data : [];
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered spolige data
  const filteredSpolige = spolige.filter(item =>
    item.stockName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.fruitType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.enteredBy?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid py-3">
      <h2 className="mb-4">Spolige Table</h2>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text bg-transparent">
              <Search size={18} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by stock name, fruit type, or person..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-hover">
          <thead className="table-light">
            <tr>
              <th>Stock Name</th>
              <th>Fruit Type</th>
              <th>Quantity</th>
              <th>Entered By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredSpolige.length > 0 ? (
              filteredSpolige.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.stockName}</td>
                  <td>{item.fruitType}</td>
                  <td>{item.quantity}</td>
                  <td>{item.enteredBy}</td>
                  <td>{item.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center">No records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpoligeTab;
