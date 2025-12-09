import React from 'react';
import { Modal, Form, FloatingLabel } from 'react-bootstrap';

const PurchaseFormModal = ({ show, handleClose, handleSubmit }) => {
  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="bg-purple text-white">
        <Modal.Title>Record Purchase</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <FloatingLabel controlId="supplier" label="Supplier Name" className="mb-3">
            <Form.Control type="text" placeholder="Supplier Name" required />
          </FloatingLabel>
          
          <FloatingLabel controlId="fruitType" label="Fruit Type" className="mb-3">
            <Form.Select aria-label="Fruit type" required>
              <option value="">Select fruit type</option>
              <option value="apples">Apples</option>
              <option value="bananas">Bananas</option>
              <option value="oranges">Oranges</option>
            </Form.Select>
          </FloatingLabel>
          
          <FloatingLabel controlId="quantity" label="Quantity (e.g. 10kg, 5 boxes)" className="mb-3">
            <Form.Control type="text" placeholder="Quantity" required />
          </FloatingLabel>
          
          <FloatingLabel controlId="cost" label="Cost (KES)" className="mb-3">
            <Form.Control type="number" step="0.01" placeholder="Cost in KES" required />
          </FloatingLabel>
          
          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-outline-secondary me-2" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-purple">
              Save Purchase
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default PurchaseFormModal;