
import React from 'react';

const InventoryForm = ({ form, onChange, onSubmit }) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Fruit Type</label>
          <select
            className="form-select"
            value={form.fruitType}
            onChange={(e) => onChange({...form, fruitType: e.target.value})}
            required
          >
            <option value="">Select Fruit</option>
            <option value="Orange">Orange</option>
            <option value="Apple">Apple</option>
            <option value="Banana">Banana</option>
            <option value="Mango">Mango</option>
            <option value="Pineapple">Pineapple</option>
            <option value="Watermelon">Watermelon</option>
          </select>
        </div>
        <div className="col-md-3 mb-3">
          <label className="form-label">Quantity</label>
          <input
            type="text"
            className="form-control"
            value={form.quantity}
            onChange={(e) => onChange({...form, quantity: e.target.value})}
            required
          />
        </div>
        <div className="col-md-3 mb-3">
          <label className="form-label">Unit</label>
          <select
            className="form-select"
            value={form.unit}
            onChange={(e) => onChange({...form, unit: e.target.value})}
          >
            <option value="kg">kg</option>
            <option value="lbs">lbs</option>
            <option value="pieces">pieces</option>
          </select>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Location</label>
          <input
            type="text"
            className="form-control"
            value={form.location}
            onChange={(e) => onChange({...form, location: e.target.value})}
            required
          />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label">Supplier Name</label>
          <input
            type="text"
            className="form-control"
            value={form.supplierName}
            onChange={(e) => onChange({...form, supplierName: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Expiry Date</label>
          <input
            type="date"
            className="form-control"
            value={form.expiryDate}
            onChange={(e) => onChange({...form, expiryDate: e.target.value})}
            required
          />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-control"
            value={form.date}
            onChange={(e) => onChange({...form, date: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Purchase Price</label>
          <input
            type="number"
            step="0.01"
            className="form-control"
            value={form.purchasePrice || ''}
            onChange={(e) => onChange({...form, purchasePrice: e.target.value})}
            required
          />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label">Purchase Date</label>
          <input
            type="date"
            className="form-control"
            value={form.purchaseDate || ''}
            onChange={(e) => onChange({...form, purchaseDate: e.target.value})}
            required
          />
        </div>
      </div>
      
      <button type="submit" className="btn btn-success">
        <i className="bi bi-plus-circle me-2"></i>
        Add to Inventory
      </button>
    </form>
  );
};

export default InventoryForm;
