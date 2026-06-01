import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { createSale } from './apiHelpers';
import { fetchStockTracking, fetchSales } from '../api/stockTracking';

function generateReceiptNumber() {
  // Generate unique receipt number: yyyyMMdd-HHMMSS-NNN
  const now = new Date();
  const datePart = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const timePart = String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const random = Math.floor(100 + Math.random() * 900); // 3-digit random number
  return `${datePart}-${timePart}-${random}`;
}

const initialItem = { fruit: '', description: '', quantity: '', unitPrice: '', total: 0 };

const paymentMethods = ['Cash', 'M-Pesa', 'Bank Transfer', 'Cheque', 'Other'];

export default function SaleInvoiceForm({ onSellerFruitsAdded }) {
  const today = new Date().toISOString().slice(0, 10);
  const [seller, setSeller] = useState({ name: 'RYANMART GROCERIES', address: '', phone: '0724327921', taxId: '' });
  const [buyer, setBuyer] = useState({ name: '', contact: '', address: '' });
  const [invoiceNum, setInvoiceNum] = useState(generateReceiptNumber());
  const [date, setDate] = useState(today);
  const [dueDate, setDueDate] = useState('');
  const [payment, setPayment] = useState(paymentMethods[0]);
  const [paymentDetails, setPaymentDetails] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Due within 7 days');
  const [items, setItems] = useState([{ ...initialItem }]);
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  const [stockRecords, setStockRecords] = useState([]);
  const [selectedStockName, setSelectedStockName] = useState('stock 1');
  const [showStockSelection, setShowStockSelection] = useState(false);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    const loadStockRecords = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const stockRes = await fetchStockTracking(token);
          const salesRes = await fetchSales(token);

          // Get stocks that have been sold (have dateOut) and are named "stock 1" or "stock 2"
          const soldStocks = Array.isArray(stockRes.data) ? stockRes.data.filter(r =>
            r.dateOut && (r.stockName === 'stock 1' || r.stockName === 'stock 2')
          ) : [];

          // Get stock names that have already been used in sales
          const usedStockNames = Array.isArray(salesRes.data) ?
            [...new Set(salesRes.data.map(sale => sale.stock_name))] : [];

          // Filter out stocks that have already been used in sales
          const availableRecords = soldStocks.filter(stock =>
            !usedStockNames.includes(stock.stockName)
          );

          setStockRecords(availableRecords);
        }
      } catch (err) {
        console.error('Error loading stock records:', err);
      }
    };
    loadStockRecords();
  }, []);

  // Keep customerName in sync with Buyer Name input (including custom names not in the dropdown)
  useEffect(() => {
    const normalized = (buyer.name || '').trim();
    setCustomerName(normalized);
  }, [buyer.name]);


  function handleItemChange(idx, field, value) {
    const newItems = items.map((item, i) =>
      i === idx ? {
        ...item,
        [field]: value,
        total: (field === 'quantity' || field === 'unitPrice')
          ? (parseFloat(field === 'unitPrice' ? value : item.unitPrice) || 0) * (isNaN(Number(field === 'quantity' ? value : item.quantity)) ? 0 : parseFloat(field === 'quantity' ? value : item.quantity))
          : item.total
      } : item
    );
    setItems(newItems);
  }

  function handleAddRow() {
    setItems([...items, { ...initialItem }]);
  }
  function handleRemoveRow(idx) {
    if (items.length === 1) return; // always at least 1
    setItems(items.filter((_, i) => i !== idx));
  }

  function getSubtotal() {
    return items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  }
  function getTaxAmount() {
    const subtotal = getSubtotal();
    const taxRate = parseFloat(tax) || 0;
    return subtotal * (taxRate / 100);
  }
  function getFinalTotal() {
    const subtotal = getSubtotal();
    const taxAmount = getTaxAmount();
    const discountAmount = parseFloat(discount) || 0;
    return subtotal + taxAmount - discountAmount;
  }
  function getBalance() {
    const total = getFinalTotal();
    const received = parseFloat(expectedAmount) || 0;
    return received - total;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const data = { seller, buyer, invoiceNum, date, dueDate, payment, paymentDetails, paymentTerms, items, subtotal: getSubtotal(), tax, taxAmount: getTaxAmount(), discount, finalTotal: getFinalTotal(), expectedAmount, balance: getBalance(), customerName };
    setSubmittedData(data);

    // Save receipt header to backend
    api.post('/api/receipts', data).catch(err => console.error('Failed to save invoice:', err));

    // IMPORTANT: Also create sales line items so CEO dashboard "Sales" updates.
    // (CEO dashboard is driven by the `sale` table, not the `receipt` table.)
    (async () => {
      try {
        if (!customerName) return;
        for (const item of data.items.filter(i => i.fruit && i.quantity && i.unitPrice)) {
          await createSale({
            stock_name: selectedStockName,
            fruit_name: item.fruit,
            qty: parseFloat(item.quantity),
            unit_price: parseFloat(item.unitPrice),
            date: data.date,
            customer_name: customerName
          });
        }

        // refresh parent tabs/tables if needed
        if (typeof onSellerFruitsAdded === 'function') {
          onSellerFruitsAdded();
        }
      } catch (err) {
        console.error('Error creating sale line items:', err);
      }
    })();
  }

  function downloadReceipt() {
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const day = d.getDate().toString().padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const formattedDate = formatDate(date);
    const formattedDueDate = dueDate ? formatDate(dueDate) : formatDate(date);
    const status = getBalance() <= 0 ? 'PAID' : 'UNPAID';
    const balance = getBalance();
    const paidAmount = expectedAmount ? parseFloat(expectedAmount) : getFinalTotal() - balance;
    const taxAmount = getTaxAmount();
    const discountAmount = parseFloat(discount) || 0;
    const finalTotal = getFinalTotal();
    const subtotal = getSubtotal();

    let receiptHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNum}</title>
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            font-size: 12px;
        }
        .header { text-align: center; margin-bottom: 10px; }
        .company-name { font-size: 16px; font-weight: bold; text-transform: uppercase; }
        .title { font-size: 18px; font-weight: bold; margin: 10px 0; }
        .info { text-align: center; line-height: 1.4; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        .divider-solid { border-top: 1px solid #000; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .col-item { text-align: left; }
        .col-qty { text-align: center; }
        .col-price { text-align: right; }
        .col-total { text-align: right; }
        .totals { margin-top: 10px; }
        .total-row { display: flex; justify-content: space-between; }
        .grand-total { font-weight: bold; font-size: 14px; }
        .balance { font-weight: bold; }
        .status { font-weight: bold; text-align: center; margin: 10px 0; }
        .footer { text-align: center; margin-top: 15px; font-size: 10px; }
        .signature { margin-top: 20px; }
        .qr-section { text-align: center; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${seller.name || 'RYANMART GROCERIES'}</div>
        <div>Nairobi, Kenya</div>
        <div>Tel: ${seller.phone || '0724327921'}</div>
        <div>VAT PIN: ${seller.taxId || 'XXXXXXXX'}</div>
    </div>
    
    <div class="title">INVOICE</div>
    
    <div class="info">
        <div>Invoice No: ${invoiceNum}</div>
        <div>Date: ${formattedDate}</div>
        <div>Due: ${formattedDueDate}</div>
        <div>Payment: ${payment}</div>
    </div>
    
    <div class="divider-solid"></div>
    
    <div>
        <div><strong>Customer:</strong></div>
        <div>${buyer.name || 'John Mwangi'}</div>
        <div>${buyer.contact || '07XXXXXXXX'}</div>
    </div>
    
    <div class="divider"></div>
    
    <table>
        <thead>
            <tr>
                <th class="col-item">ITEM</th>
                <th class="col-qty">QTY</th>
                <th class="col-price">PRICE</th>
                <th class="col-total">TOTAL</th>
            </tr>
        </thead>
        <tbody>
`;

    items.filter(i => i.fruit && i.quantity && i.unitPrice).forEach(i => {
      receiptHTML += `
            <tr>
                <td class="col-item">${i.fruit}</td>
                <td class="col-qty">${i.quantity}</td>
                <td class="col-price">${parseFloat(i.unitPrice).toFixed(2)}</td>
                <td class="col-total">${parseFloat(i.total).toFixed(2)}</td>
            </tr>
`;
    });

    receiptHTML += `
        </tbody>
    </table>
    
    <div class="divider"></div>
    
    <div class="totals">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>VAT (${tax || 16}%):</span>
            <span>${taxAmount.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Discount:</span>
            <span>${discountAmount.toFixed(2)}</span>
        </div>
        <div class="divider-solid"></div>
        <div class="total-row grand-total">
            <span>TOTAL:</span>
            <span>${finalTotal.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>Paid:</span>
            <span>${paidAmount.toFixed(2)}</span>
        </div>
        <div class="total-row balance">
            <span>Balance:</span>
            <span>${balance.toFixed(2)}</span>
        </div>
    </div>
    
    <div class="status">Status: ${status}</div>
    
    <div class="qr-section">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${invoiceNum}" alt="QR Code" />
    </div>
    
    <div class="info">
        <div>Payment Terms: ${paymentTerms || 'Pay on receipt'}</div>
        <div class="signature">Authorized By: ________</div>
    </div>
    
    <div class="footer">
        <div>Thank you for shopping with us!</div>
        <div>Powered by RyanMart POS</div>
    </div>
</body>
</html>
`;

    // Create blob and download
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoiceNum}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }


  // Save to sales table (stock name is auto-selected for now)
  const handleSaveToTable = async () => {
    if (!customerName) {
      alert('Please enter a customer name.');
      return;
    }
    if (!submittedData) {
      alert('Please preview the receipt first.');
      return;
    }
    try {
      for (const item of submittedData.items.filter(i => i.fruit && i.quantity && i.unitPrice)) {
        await createSale({
          stock_name: selectedStockName,
          fruit_name: item.fruit,
          qty: parseFloat(item.quantity),
          unit_price: parseFloat(item.unitPrice),
          date: submittedData.date,
          customer_name: customerName
        });
      }
      alert('Items added to sales table successfully!');
      setShowStockSelection(false);
      setCustomerName('');
      // Call parent callback to refresh table
      if (typeof onSellerFruitsAdded === 'function') {
        onSellerFruitsAdded();
      }
    } catch (err) {
      console.error('Error adding to sales table:', err);
      alert('Failed to add items to table. Please try again.');
    }
  };

  return (
    <div className="card shadow-lg border-0 bg-light">
      <div className="card-header bg-primary text-white"><h4>New Invoice</h4></div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
            <div className="row mb-2">
              <div className="col-md-3"><label className="form-label">Business Name</label>
                <input className="form-control" required value={seller.name} onChange={e => setSeller({ ...seller, name: e.target.value })} /></div>
              <div className="col-md-3"><label className="form-label">Seller Address</label>
                <input className="form-control" value={seller.address} onChange={e => setSeller({ ...seller, address: e.target.value })} /></div>
              <div className="col-md-2"><label className="form-label">Seller Phone</label>
                <input className="form-control" value={seller.phone} onChange={e => setSeller({ ...seller, phone: e.target.value })} /></div>
              <div className="col-md-4"><label className="form-label">Tax Registration / PIN</label>
                <input className="form-control" value={seller.taxId} onChange={e => setSeller({ ...seller, taxId: e.target.value })} /></div>
            </div>
          <div className="row mb-2">
            <div className="col-md-4"><label className="form-label">Buyer Name</label>
              <input 
                className="form-control" 
                value={buyer.name} 
                onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
                list="buyer-options"
                placeholder="Select or type buyer name"
              />
              <datalist id="buyer-options">
                <option value="Beyond" />
                <option value="Carrefour Supermarket" />
                <option value="Chebet" />
                <option value="Cilantro" />
                <option value="Cornershop" />
                <option value="Edith" />
                <option value="Fresh and Juice" />
                <option value="Fruity Fruit" />
                <option value="Jam" />
                <option value="Jarine Investment" />
                <option value="Johanna" />
                <option value="Kalimoni" />
                <option value="Parakash Juice" />
                <option value="Zucchini supermarket" />
              </datalist>
            </div>
            <div className="col-md-4"><label className="form-label">Buyer Contact</label>
              <input className="form-control" value={buyer.contact} onChange={e => setBuyer({ ...buyer, contact: e.target.value })} /></div>
            <div className="col-md-4"><label className="form-label">Buyer Address</label>
              <input className="form-control" value={buyer.address} onChange={e => setBuyer({ ...buyer, address: e.target.value })} /></div>
          </div>
          <div className="row mb-2">
            <div className="col-md-4"><label className="form-label">Payment Method</label>
              <select className="form-select" value={payment} onChange={e => setPayment(e.target.value)}>{paymentMethods.map(p => <option key={p}>{p}</option>)}</select></div>
            <div className="col-md-4"><label className="form-label">Payment Details</label>
              <input className="form-control" value={paymentDetails} onChange={e => setPaymentDetails(e.target.value)} /></div>
            <div className="col-md-4"><label className="form-label">Payment Terms</label>
              <input className="form-control" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} /></div>
          </div>
          <div className="row mb-2">
            <div className="col-md-4"><label className="form-label">Invoice Number</label>
              <input className="form-control" value={invoiceNum} onChange={e => setInvoiceNum(e.target.value)} placeholder="Auto-generated if not entered" /></div>
            <div className="col-md-4"><label className="form-label">Date Issued</label>
              <input className="form-control" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
            <div className="col-md-4"><label className="form-label">Due Date</label>
              <input className="form-control" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <div className="row mb-2">
            <div className="col-md-4"><label className="form-label">Discount (KES)</label>
              <input className="form-control" type="number" min="0" value={discount} onChange={e => setDiscount(e.target.value)} /></div>
            <div className="col-md-4"><label className="form-label">Tax (VAT %)</label>
              <input className="form-control" type="number" min="0" value={tax} onChange={e => setTax(e.target.value)} /></div>
            <div className="col-md-4"><label className="form-label">Expected Amount (KES)</label>
              <input className="form-control" type="number" min="0" value={expectedAmount} onChange={e => setExpectedAmount(e.target.value)} /></div>
          </div>

          <hr />
          <h5>Items Sold</h5>
          <table className="table table-bordered table-sm align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Item / Service</th>
                <th>Quantity</th>
                <th>Unit Price (KES)</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td><input className="form-control" value={item.fruit} onChange={e => handleItemChange(idx, 'fruit', e.target.value)} required /></td>
                  <td><input className="form-control" type="number" min="0" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} required /></td>
                  <td><input className="form-control" type="number" min="0" value={item.unitPrice} onChange={e => handleItemChange(idx, 'unitPrice', e.target.value)} required /></td>
                  <td>{parseFloat(item.total || 0).toLocaleString()}</td>
                  <td>
                    {items.length > 1 && <button className="btn btn-danger btn-sm" type="button" onClick={() => handleRemoveRow(idx)}>&times;</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-secondary btn-sm mb-3" type="button" onClick={handleAddRow}>Add Item</button>
          <div className="mb-2 text-end">
            <span className="me-3 fw-bold">Subtotal: </span> KES {getSubtotal().toLocaleString()}
            <span className="ms-4 me-3 fw-bold">Final Total: </span> <span className="text-primary fw-bold">KES {getFinalTotal().toLocaleString()}</span>
          </div>
          <button className="btn btn-primary" type="submit">Preview Invoice</button>
        </form>
      </div>
      {submittedData && (
        <div className="card m-3 shadow border border-secondary" style={{ maxWidth: 420, margin: '20px auto', fontFamily: "'Courier New', Courier, monospace", fontSize: '11px' }}>
          <div className="card-body">
            <div className="text-center mb-2">
              <div className="fw-bold text-uppercase" style={{ fontSize: 14 }}>{submittedData.seller.name || 'RYANMART GROCERIES'}</div>
              <div style={{ fontSize: 10 }}>Nairobi, Kenya</div>
              <div style={{ fontSize: 10 }}>Tel: {submittedData.seller.phone || '0724327921'}</div>
              <div style={{ fontSize: 10 }}>VAT PIN: {submittedData.seller.taxId || 'XXXXXXXX'}</div>
            </div>
            
            <div className="text-center fw-bold" style={{ fontSize: 16, margin: '10px 0' }}>INVOICE</div>
            
            <div className="text-center" style={{ fontSize: 10, lineHeight: 1.5 }}>
              <div>Invoice No: {submittedData.invoiceNum}</div>
              <div>Date: {(() => { const d = new Date(submittedData.date); return `${d.getDate().toString().padStart(2, '0')}-${d.toLocaleString('en-US', { month: 'short' })}-${d.getFullYear()}`; })()}</div>
              <div>Due: {submittedData.dueDate ? (() => { const d = new Date(submittedData.dueDate); return `${d.getDate().toString().padStart(2, '0')}-${d.toLocaleString('en-US', { month: 'short' })}-${d.getFullYear()}`; })() : (() => { const d = new Date(submittedData.date); return `${d.getDate().toString().padStart(2, '0')}-${d.toLocaleString('en-US', { month: 'short' })}-${d.getFullYear()}`; })()}</div>
              <div>Payment: {submittedData.payment}</div>
            </div>
            
            <hr style={{ borderTop: '1px solid #000', margin: '8px 0' }} />
            
            <div style={{ fontSize: 10 }}>
              <div><strong>Customer:</strong></div>
              <div>{submittedData.buyer.name || 'John Mwangi'}</div>
              <div>{submittedData.buyer.contact || '07XXXXXXXX'}</div>
            </div>
            
            <hr style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
            
            <table className="table table-sm table-borderless mb-0" style={{ fontSize: 10 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '2px' }}>ITEM</th>
                  <th style={{ textAlign: 'center', padding: '2px' }}>QTY</th>
                  <th style={{ textAlign: 'right', padding: '2px' }}>PRICE</th>
                  <th style={{ textAlign: 'right', padding: '2px' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {submittedData.items.filter(i => i.fruit && i.quantity && i.unitPrice).map((i, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left', padding: '2px' }}>{i.fruit}</td>
                    <td style={{ textAlign: 'center', padding: '2px' }}>{i.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '2px' }}>{parseFloat(i.unitPrice).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '2px' }}>{parseFloat(i.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <hr style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
            
            <div style={{ fontSize: 10 }}>
              <div className="d-flex justify-content-between"><span>Subtotal:</span><span>{submittedData.subtotal.toFixed(2)}</span></div>
              <div className="d-flex justify-content-between"><span>VAT ({submittedData.tax || 16}%):</span><span>{submittedData.taxAmount.toFixed(2)}</span></div>
              <div className="d-flex justify-content-between"><span>Discount:</span><span>{parseFloat(submittedData.discount || 0).toFixed(2)}</span></div>
              <hr style={{ borderTop: '1px solid #000', margin: '8px 0' }} />
              <div className="d-flex justify-content-between fw-bold" style={{ fontSize: 12 }}><span>TOTAL:</span><span>{submittedData.finalTotal.toFixed(2)}</span></div>
              <div className="d-flex justify-content-between"><span>Paid:</span><span>{submittedData.expectedAmount ? parseFloat(submittedData.expectedAmount).toFixed(2) : (submittedData.finalTotal - submittedData.balance).toFixed(2)}</span></div>
              <div className="d-flex justify-content-between fw-bold"><span>Balance:</span><span>{submittedData.balance.toFixed(2)}</span></div>
            </div>
            
            <div className="text-center fw-bold mt-2" style={{ fontSize: 11 }}>
              Status: {submittedData.balance <= 0 ? 'PAID' : 'UNPAID'}
            </div>
            
            <div className="text-center mt-2">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${submittedData.invoiceNum}`} alt="QR Code" />
            </div>
            
            <div className="text-center mt-2" style={{ fontSize: 10 }}>
              <div>Payment Terms: {submittedData.paymentTerms || 'Pay on receipt'}</div>
              <div style={{ marginTop: '15px' }}>Authorized By: ________</div>
            </div>
            
            <div className="text-center mt-3" style={{ fontSize: 9 }}>
              <div>Thank you for shopping with us!</div>
              <div>Powered by RyanMart POS</div>
            </div>
            
            <div className="text-center mt-3">
              <button className="btn btn-outline-primary btn-sm me-2" onClick={downloadReceipt}>Download Invoice</button>
              <button className="btn btn-outline-success btn-sm" onClick={handleSaveToTable}>Save to Table</button>
            </div>
            {showStockSelection && (
              <div className="mt-3 p-3 border rounded bg-light">
                {/* Stock selection muted - will use default "stock 1" */}
                <h6>Customer Name:</h6>
                <input
                  type="text"
                  className="form-control mb-2"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  list="customer-options"
                  placeholder="Select or type customer name"
                />
                <datalist id="customer-options">
                  <option value="Beyond" />
                  <option value="Carrefour Supermarket" />
                  <option value="Chebet" />
                  <option value="Cilantro" />
                  <option value="Cornershop" />
                  <option value="Edith" />
                  <option value="Fresh and Juice" />
                  <option value="Fruity Fruit" />
                  <option value="Jam" />
                  <option value="Jarine Investment" />
                  <option value="Johanna" />
                  <option value="Kalimoni" />
                  <option value="Parakash Juice" />
                  <option value="Zucchini supermarket" />
                </datalist>
                <button
                  className="btn btn-primary btn-sm me-2"
                  onClick={handleSaveToTable}
                  disabled={!customerName}
                >
                  Confirm Save to Table
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowStockSelection(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

