import React, { useState } from 'react';
import { Modal, Form, FloatingLabel } from 'react-bootstrap';

const PurchaseFormModal = ({ show, onClose, onAddPurchase }) => {
  const [formData, setFormData] = useState({
    employeeName: '',
    fruitType: '',
    quantity: '',
    unit: 'kg',
    buyerName: '',
    amountPerKg: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate total amount
    if (name === 'quantity' || name === 'amountPerKg') {
      const quantity = name === 'quantity' ? parseFloat(value) : parseFloat(formData.quantity);
      const amountPerKg = name === 'amountPerKg' ? parseFloat(value) : parseFloat(formData.amountPerKg);
      if (!isNaN(quantity) && !isNaN(amountPerKg)) {
        const totalAmount = quantity * amountPerKg;
        setFormData(prev => ({
          ...prev,
          amount: totalAmount.toFixed(2)
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const purchaseData = {
        ...formData,
        purchaserEmail: 'ceo@example.com', // Default for CEO dashboard
        quantity: formData.quantity,
        amount: parseFloat(formData.amount),
        amountPerKg: parseFloat(formData.amountPerKg)
      };

      // Call the API to add purchase
      const response = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(purchaseData)
      });

      if (response.ok) {
        const newPurchase = await response.json();
        onAddPurchase(newPurchase.data || newPurchase);
        // Reset form
        setFormData({
          employeeName: '',
          fruitType: '',
          quantity: '',
          unit: 'kg',
          buyerName: '',
          amountPerKg: '',
          amount: '',
          date: new Date().toISOString().split('T')[0]
        });
        onClose();
      } else {
        console.error('Failed to add purchase');
      }
    } catch (error) {
      console.error('Error adding purchase:', error);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>Add Purchase</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <FloatingLabel controlId="employeeName" label="Employee Name">
                <Form.Control
                  type="text"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleChange}
                  placeholder="Employee Name"
                  required
                />
              </FloatingLabel>
            </div>
            <div className="col-md-6 mb-3">
              <FloatingLabel controlId="fruitType" label="Fruit Type">
                <Form.Select
                  name="fruitType"
                  value={formData.fruitType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select fruit type</option>
                  <option value="Sweet banana">Sweet banana</option>
                  <option value="Kampala">Kampala</option>
                  <option value="Cavendish">Cavendish</option>
                  <option value="Plantain">Plantain</option>
                  <option value="Matoke">Matoke</option>
                  <option value="American sweet potatoes">American sweet potatoes</option>
                  <option value="White sweet potatoes">White sweet potatoes</option>
                  <option value="Red sweet potatoes">Red sweet potatoes</option>
                  <option value="Local Avocados">Local Avocados</option>
                  <option value="Hass Avocados">Hass Avocados</option>
                  <option value="Oranges">Oranges</option>
                  <option value="Pixie">Pixie</option>
                  <option value="Lemons">Lemons</option>
                </Form.Select>
              </FloatingLabel>
            </div>
          </div>

          <div className="row">
            <div className="col-md-4 mb-3">
              <FloatingLabel controlId="quantity" label="Quantity">
                <Form.Control
                  type="text"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Quantity"
                  required
                />
              </FloatingLabel>
            </div>
            <div className="col-md-2 mb-3">
              <FloatingLabel controlId="unit" label="Unit">
                <Form.Select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                  <option value="pieces">pieces</option>
                </Form.Select>
              </FloatingLabel>
            </div>
            <div className="col-md-6 mb-3">
              <FloatingLabel controlId="buyerName" label="Farmer Name">
                <Form.Control
                  type="text"
                  name="buyerName"
                  value={formData.buyerName}
                  onChange={handleChange}
                  placeholder="Farmer Name"
                  required
                />
              </FloatingLabel>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <FloatingLabel controlId="amountPerKg" label="Amount per KG">
                <Form.Control
                  type="number"
                  step="0.01"
                  name="amountPerKg"
                  value={formData.amountPerKg}
                  onChange={handleChange}
                  placeholder="Amount per KG"
                  required
                />
              </FloatingLabel>
            </div>
            <div className="col-md-6 mb-3">
              <FloatingLabel controlId="amount" label="Total Amount (KES)">
                <Form.Control
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Total Amount"
                  required
                  readOnly
                />
              </FloatingLabel>
            </div>
          </div>

          <div className="mb-3">
            <FloatingLabel controlId="date" label="Date">
              <Form.Control
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </FloatingLabel>
          </div>

          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Purchase
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default PurchaseFormModal;
