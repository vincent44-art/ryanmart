
import React, { useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to parse date consistently
const parseDate = (value) => {
  if (!value) return null;
  try {
    return new Date(value);
  } catch (e) {
    return null;
  }
};

// Match a sale to a stock-out record using fruit type and date proximity
const matchStockForSale = (sale, stockRecords = []) => {
  const fruit = sale.fruitType || sale.fruit_type || '';
  const saleDate = parseDate(sale.date || sale.sale_date);
  const candidates = (stockRecords || []).filter((r) => (r.fruitType || '') === fruit);
  if (candidates.length === 0) return null;
  if (!saleDate) return candidates[candidates.length - 1];
  // Prefer the latest stock with dateOut <= saleDate, else latest dateIn <= saleDate, else latest
  const withOutBefore = candidates
    .filter((r) => r.dateOut && parseDate(r.dateOut) && parseDate(r.dateOut) <= saleDate)
    .sort((a, b) => parseDate(b.dateOut) - parseDate(a.dateOut));
  if (withOutBefore.length > 0) return withOutBefore[0];
  const withInBefore = candidates
    .filter((r) => r.dateIn && parseDate(r.dateIn) && parseDate(r.dateIn) <= saleDate)
    .sort((a, b) => parseDate(b.dateIn) - parseDate(a.dateIn));
  if (withInBefore.length > 0) return withInBefore[0];
  return candidates[candidates.length - 1];
};

const formatDateCell = (d) => (d ? new Date(d).toLocaleDateString() : '');

const SalesHistoryTable = ({ userSales, formatKenyanCurrency, stockRecords = [] }) => {
  const rows = useMemo(() => (Array.isArray(userSales) ? userSales : []), [userSales]);

  const enriched = useMemo(() => {
    return rows.map((sale) => {
      const matchedStock = matchStockForSale(sale, stockRecords);
      const stockName = matchedStock?.stockName || 'Unknown';
      const unitPrice = matchedStock?.amountPerKg
        ? parseFloat(matchedStock.amountPerKg)
        : (sale.revenue && (sale.quantitySold || sale.quantity))
          ? parseFloat(sale.revenue) / parseFloat(sale.quantitySold || sale.quantity)
          : null;
      const qty = parseFloat(sale.quantitySold || sale.quantity || 0);
      const amount = sale.revenue != null ? parseFloat(sale.revenue) : (unitPrice ? unitPrice * qty : 0);
      const date = sale.date || sale.sale_date;
      const fruit = sale.fruitType || sale.fruit_type || '';
      return { stockName, date, fruit, qty, unitPrice, amount, raw: sale };
    });
  }, [rows, stockRecords]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const r of enriched) {
      const key = r.stockName || 'Unknown';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    // Sort each group by date desc
    for (const arr of map.values()) {
      arr.sort((a, b) => (parseDate(b.date) || 0) - (parseDate(a.date) || 0));
    }
    return map;
  }, [enriched]);

  const downloadPDF = (stockName, items) => {
    const doc = new jsPDF();
    doc.text(`Sales Report - ${stockName}`, 10, 10);
    autoTable(doc, {
      head: [["Stock Name", "Date", "Fruit", "Qty", "Qty/Unit", "Amount"]],
      body: items.map((r) => [
        stockName,
        formatDateCell(r.date),
        r.fruit,
        isNaN(r.qty) ? '' : r.qty,
        r.unitPrice != null && !isNaN(r.unitPrice) ? formatKenyanCurrency(r.unitPrice) : '-',
        formatKenyanCurrency(r.amount || 0),
      ]),
      startY: 20,
    });
    const totalQty = items.reduce((s, r) => s + (isNaN(r.qty) ? 0 : r.qty), 0);
    const totalAmount = items.reduce((s, r) => s + (r.amount || 0), 0);
    autoTable(doc, {
      head: [["Totals", "", "", "Qty", "", "Amount"]],
      body: [["", "", "", totalQty, "", formatKenyanCurrency(totalAmount)]],
      startY: doc.lastAutoTable.finalY + 5,
    });
    doc.save(`sales_${stockName.replace(/\s+/g, '_')}.pdf`);
  };

  if (rows.length === 0) {
    return (
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Stock Name</th>
              <th>Date</th>
              <th>Fruit</th>
              <th>Qty</th>
              <th>Qty per Unit</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" className="text-center text-muted py-4">
                <i className="bi bi-inbox display-4 d-block mb-2"></i>
                No sales recorded yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover align-middle">
        <thead className="table-dark">
          <tr>
            <th>Stock Name</th>
            <th>Date</th>
            <th>Fruit</th>
            <th>Qty</th>
            <th>Qty per Unit</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {[...groups.entries()].map(([stockName, items]) => {
            const totalQty = items.reduce((s, r) => s + (isNaN(r.qty) ? 0 : r.qty), 0);
            const totalAmount = items.reduce((s, r) => s + (r.amount || 0), 0);
            return (
              <React.Fragment key={stockName}>
                <tr>
                  <td colSpan={6} className="bg-light fw-bold">
                    {stockName}
                    <button
                      className="btn btn-sm btn-outline-primary ms-2"
                      onClick={() => downloadPDF(stockName, items)}
                    >
                      Download PDF
                    </button>
                  </td>
                </tr>
                {items.map((r, idx) => (
                  <tr key={`${stockName}-${idx}`}>
                    <td>{r.stockName}</td>
                    <td>{formatDateCell(r.date)}</td>
                    <td><span className="badge bg-primary">{r.fruit}</span></td>
                    <td>{isNaN(r.qty) ? '' : r.qty}</td>
                    <td>{r.unitPrice != null && !isNaN(r.unitPrice) ? formatKenyanCurrency(r.unitPrice) : '-'}</td>
                    <td className="fw-bold text-success">{formatKenyanCurrency(r.amount || 0)}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={3} className="text-end fw-bold">Total Sold</td>
                  <td className="fw-bold">{totalQty}</td>
                  <td></td>
                  <td className="fw-bold text-success">{formatKenyanCurrency(totalAmount)}</td>
                </tr>
                <tr><td colSpan={6} style={{ background: '#f8f9fa' }}></td></tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SalesHistoryTable;
