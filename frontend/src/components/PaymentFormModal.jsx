import React from 'react';
import { Modal, Form, FloatingLabel } from 'react-bootstrap';

const PaymentFormModal = ({ show, handleClose, handleSubmit }) => {
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="bg-purple text-white">
        <Modal.Title>Record Payment</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <FloatingLabel controlId="employee" label="Employee" className="mb-3">
            <Form.Select aria-label="Select employee" required>
              <option value="">Select employee</option>
              <option value="1">John Doe (CEO)</option>
              <option value="2">Jane Smith (Store Keeper)</option>
            </Form.Select>
          </FloatingLabel>
          
          <FloatingLabel controlId="amount" label="Amount (KES)" className="mb-3">
            <Form.Control type="number" step="0.01" placeholder="Amount in KES" required />
          </FloatingLabel>
          
          <FloatingLabel controlId="paymentDate" label="Payment Date" className="mb-3">
            <Form.Control type="date" required />
          </FloatingLabel>
          
          <FloatingLabel controlId="notes" label="Notes" className="mb-3">
            <Form.Control as="textarea" placeholder="Payment notes" style={{ height: '100px' }} />
          </FloatingLabel>
          
          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-outline-secondary me-2" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-purple">
              Record Payment
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default PaymentFormModal;