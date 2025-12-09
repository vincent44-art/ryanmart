
import React from 'react';

const StockMovementForm = ({ form, onChange, onSubmit }) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Fruit Type</label>
          <input
            type="text"
            className="form-control"
            value={form.fruitType}
            onChange={(e) => onChange({...form, fruitType: e.target.value})}
            list="fruits"
            required
          />
          <datalist id="fruits">
            <option value="Sweet banana" />
            <option value="Kampala" />
            <option value="Cavendish" />
            <option value="Plantain" />
            <option value="Matoke" />
            <option value="American sweet potatoes" />
            <option value="White sweet potatoes" />
            <option value="Red sweet potatoes" />
            <option value="Local Avocados" />
            <option value="Hass Avocados" />
            <option value="Oranges" />
            <option value="Pixie" />
            <option value="Lemons" />
          </datalist>
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label">Movement Type</label>
          <select
            className="form-select"
            value={form.movementType}
            onChange={(e) => onChange({...form, movementType: e.target.value})}
          >
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
            <option value="sale">Sale</option>
            <option value="spoilage">Spoilage</option>
          </select>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Quantity</label>
          <input
            type="text"
            className="form-control"
            value={form.quantity}
            onChange={(e) => onChange({...form, quantity: e.target.value})}
            required
          />
        </div>
        <div className="col-md-4 mb-3">
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
        <div className="col-md-4 mb-3">
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
          <label className="form-label">Reason</label>
          <input
            type="text"
            className="form-control"
            value={form.reason}
            onChange={(e) => onChange({...form, reason: e.target.value})}
            required
          />
        </div>
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
      </div>

      {form.movementType === 'sale' && (
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Selling Price</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={form.sellingPrice || ''}
              onChange={(e) => onChange({...form, sellingPrice: e.target.value})}
              required
            />
          </div>
        </div>
      )}
      
      <button type="submit" className="btn btn-warning">
        <i className="bi bi-arrow-left-right me-2"></i>
        Record Movement
      </button>
    </form>
  );
};

export default StockMovementForm;
