import React, { useState } from 'react';
import { Modal, Form, FloatingLabel } from 'react-bootstrap';

const SalaryFormModal = ({ show, onClose, onSave, users }) => {
  const [form, setForm] = useState({
    user_id: '',
    description: '',
    amount: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.user_id || !form.amount) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    onSave({
      user_id: parseInt(form.user_id, 10),
      description: form.description,
      amount: parseFloat(form.amount),
      date: dateStr
    });
    onClose();
    setForm({ user_id: '', description: '', amount: '' });
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton className="bg-purple text-white">
        <Modal.Title>Add Salary</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <FloatingLabel controlId="userSelect" label="Employee" className="mb-3">
            <Form.Select name="user_id" value={form.user_id} onChange={handleChange} required>
              <option value="">Select Employee</option>
              {Array.isArray(users) && users.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </Form.Select>
          </FloatingLabel>
          <FloatingLabel controlId="description" label="Description" className="mb-3">
            <Form.Control
              type="text"
              name="description"
              placeholder="Description (optional)"
              value={form.description}
              onChange={handleChange}
            />
          </FloatingLabel>
          <FloatingLabel controlId="amount" label="Salary Amount (KES)" className="mb-3">
            <Form.Control
              type="number"
              name="amount"
              placeholder="Salary in KES"
              value={form.amount}
              onChange={handleChange}
              required
            />
          </FloatingLabel>
          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-outline-secondary me-2" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-purple">
              Add Salary
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default SalaryFormModal;
