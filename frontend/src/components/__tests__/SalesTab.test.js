import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import SalesTab from '../SalesTab';

// Mock the API calls
jest.mock('../../api/sellerFruits', () => ({
  fetchSellerFruits: jest.fn(),
  createSellerFruit: jest.fn(),
  deleteSellerFruit: jest.fn(),
}));

// Mock the AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    token: 'mock-token'
  })
}));

describe('SalesTab Component', () => {
  const mockSellerFruits = [
    {
      id: 1,
      stock_name: 'Stock A',
      fruit_name: 'Apple',
      qty: 10,
      unit_price: 50,
      date: '2024-01-01',
      amount: 500,
      creator_email: 'seller@example.com'
    },
    {
      id: 2,
      stock_name: 'Stock B',
      fruit_name: 'Banana',
      qty: 20,
      unit_price: 30,
      date: '2024-01-02',
      amount: 600,
      creator_email: 'seller2@example.com'
    }
  ];

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  test('renders the SalesTab component correctly', async () => {
    // Mock successful response for this test
    const { fetchSellerFruits } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce([]);

    const { container } = render(<SalesTab />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Seller Fruits Management')).toBeInTheDocument();
    });

    // Check if the table structure is present
    expect(container.querySelector('table')).toBeInTheDocument();
    expect(container.querySelector('thead')).toBeInTheDocument();
    expect(container.querySelector('tbody')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    render(<SalesTab />);
    // Check for loading spinner
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays "No seller fruits records found" when no data', async () => {
    // Mock empty response
    const { fetchSellerFruits } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce([]);

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('No seller fruits records found')).toBeInTheDocument();
    });
  });

  test('displays seller fruits data when available', async () => {
    // Mock successful response
    const { fetchSellerFruits } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce(mockSellerFruits);

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('Stock A')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('Ksh 50.00')).toBeInTheDocument();
      expect(screen.getByText('Ksh 500.00')).toBeInTheDocument();
      expect(screen.getByText('seller@example.com')).toBeInTheDocument();
    });
  });

  test('search functionality works', async () => {
    const { fetchSellerFruits } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce(mockSellerFruits);

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('Stock A')).toBeInTheDocument();
      expect(screen.getByText('Stock B')).toBeInTheDocument();
    });

    // Find and use the search input
    const searchInput = screen.getByPlaceholderText('Search seller fruits...');
    fireEvent.change(searchInput, { target: { value: 'Apple' } });

    await waitFor(() => {
      expect(screen.getByText('Stock A')).toBeInTheDocument();
      expect(screen.queryByText('Stock B')).not.toBeInTheDocument();
    });
  });

  test('table has correct column headers', async () => {
    const { fetchSellerFruits } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce([]);

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('Stock Name')).toBeInTheDocument();
      expect(screen.getByText('Fruit Name')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('Unit Price')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Creator Email')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  test('Add Seller Fruit button is present', async () => {
    const { fetchSellerFruits } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce([]);

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('Add Seller Fruit')).toBeInTheDocument();
    });
  });

  test('Clear All button is present', async () => {
    const { fetchSellerFruits } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce([]);

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('Clear All')).toBeInTheDocument();
    });
  });

  test('displays error message when form validation fails', async () => {
    const { fetchSellerFruits } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce([]);

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('Add Seller Fruit')).toBeInTheDocument();
    });

    // Click Add Seller Fruit button
    fireEvent.click(screen.getByText('Add Seller Fruit'));

    // Find submit button and click without filling form
    const submitButton = screen.getByText('Record Seller Fruit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Stock name is required')).toBeInTheDocument();
    });
  });

  test('displays error message when quantity is invalid', async () => {
    const { fetchSellerFruits } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce([]);

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('Add Seller Fruit')).toBeInTheDocument();
    });

    // Click Add Seller Fruit button
    fireEvent.click(screen.getByText('Add Seller Fruit'));

    // Fill form with invalid quantity
    fireEvent.change(screen.getByPlaceholderText('e.g., Stock A, Stock B'), { target: { value: 'Stock A' } });
    fireEvent.change(screen.getByLabelText('Fruit Name'), { target: { value: 'Apple' } }); // Fruit name input
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '-5' } }); // Quantity input
    fireEvent.change(screen.getByLabelText('Unit Price (KES)'), { target: { value: '50' } }); // Unit price input

    // Find submit button and click
    const submitButton = screen.getByText('Record Seller Fruit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Quantity must be a positive number')).toBeInTheDocument();
    });
  });

  test('displays error message when unit price is invalid', async () => {
    const { fetchSellerFruits } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce([]);

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('Add Seller Fruit')).toBeInTheDocument();
    });

    // Click Add Seller Fruit button
    fireEvent.click(screen.getByText('Add Seller Fruit'));

    // Fill form with invalid unit price
    fireEvent.change(screen.getByPlaceholderText('e.g., Stock A, Stock B'), { target: { value: 'Stock A' } });
    fireEvent.change(screen.getByLabelText('Fruit Name'), { target: { value: 'Apple' } }); // Fruit name input
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10' } }); // Quantity input
    fireEvent.change(screen.getByLabelText('Unit Price (KES)'), { target: { value: '0' } }); // Unit price input

    // Find submit button and click
    const submitButton = screen.getByText('Record Seller Fruit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Unit price must be a positive number')).toBeInTheDocument();
    });
  });

  test('handles API error during form submission', async () => {
    const { fetchSellerFruits, createSellerFruit } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce([]);
    createSellerFruit.mockRejectedValueOnce(new Error('API Error'));

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('Add Seller Fruit')).toBeInTheDocument();
    });

    // Click Add Seller Fruit button
    fireEvent.click(screen.getByText('Add Seller Fruit'));

    // Fill form with valid data
    fireEvent.change(screen.getByPlaceholderText('e.g., Stock A, Stock B'), { target: { value: 'Stock A' } });
    fireEvent.change(screen.getByLabelText('Fruit Name'), { target: { value: 'Apple' } }); // Fruit name input
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '10' } }); // Quantity input
    fireEvent.change(screen.getByLabelText('Unit Price (KES)'), { target: { value: '50' } }); // Unit price input

    // Find submit button and click
    const submitButton = screen.getByText('Record Seller Fruit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  test('handles delete error', async () => {
    const { fetchSellerFruits, deleteSellerFruit } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce(mockSellerFruits);
    deleteSellerFruit.mockRejectedValueOnce(new Error('Delete failed'));

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('Stock A')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButton = screen.getAllByTitle('Delete seller fruit')[0];
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Delete failed')).toBeInTheDocument();
    });
  });

  test('successfully submits form and refreshes data', async () => {
    const { fetchSellerFruits, createSellerFruit } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce([]);
    createSellerFruit.mockResolvedValueOnce({ id: 1, stock_name: 'Stock A', fruit_name: 'Apple', qty: 10, unit_price: 50, amount: 500 });
    fetchSellerFruits.mockResolvedValueOnce([{ id: 1, stock_name: 'Stock A', fruit_name: 'Apple', qty: 10, unit_price: 50, amount: 500, creator_email: 'test@example.com', date: '2024-01-01' }]);

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('Add Seller Fruit')).toBeInTheDocument();
    });

    // Click Add Seller Fruit button
    fireEvent.click(screen.getByText('Add Seller Fruit'));

    // Fill form with valid data
    fireEvent.change(screen.getByPlaceholderText('e.g., Stock A, Stock B'), { target: { value: 'Stock A' } });
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: 'Apple' } }); // Fruit name input
    fireEvent.change(screen.getAllByDisplayValue('')[1], { target: { value: '10' } }); // Quantity input
    fireEvent.change(screen.getAllByDisplayValue('')[2], { target: { value: '50' } }); // Unit price input

    // Find submit button and click
    const submitButton = screen.getByText('Record Seller Fruit');
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Stock A')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });
  });

  test('Clear All functionality works', async () => {
    const { fetchSellerFruits } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce(mockSellerFruits);

    // Mock fetch for clear operation
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      })
    );

    // Mock window.confirm
    window.confirm = jest.fn(() => true);

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('Stock A')).toBeInTheDocument();
    });

    // Click Clear All button
    const clearButton = screen.getByText('Clear All');
    await act(async () => {
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(screen.getByText('No seller fruits records found')).toBeInTheDocument();
    });
  });

  test('PDF download button is present and clickable', async () => {
    const { fetchSellerFruits } = require('../../api/sellerFruits');
    fetchSellerFruits.mockResolvedValueOnce(mockSellerFruits);

    // Mock fetch for PDF download
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob())
      })
    );

    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock document methods
    document.createElement = jest.fn(() => ({
      click: jest.fn(),
      href: '',
      download: ''
    }));
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();

    render(<SalesTab />);

    await waitFor(() => {
      expect(screen.getByText('Stock A')).toBeInTheDocument();
    });

    // Find PDF download button
    const pdfButton = screen.getByTitle('Download PDF Report');
    expect(pdfButton).toBeInTheDocument();

    // Click PDF button
    await act(async () => {
      fireEvent.click(pdfButton);
    });

    // Verify fetch was called for PDF download
    expect(global.fetch).toHaveBeenCalledWith(
      'https://ryanmart.store/api/seller-fruits/report/2024-01-01',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    );
  });
});
