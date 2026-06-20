import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const n = (v) => { const x = Number(v); return isNaN(x) ? 0 : x; };

export function generateInvoicePDF({ type, invoiceNo, date, partyLabel, partyName, partyPhone, partyCity, items, total, paid, balance, status }) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  doc.text('ERP SYSTEM', 14, 15);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(type === 'sale' ? 'SALES INVOICE' : 'PURCHASE INVOICE', 14, 24);

  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoiceNo}`, pageWidth - 14, 15, { align: 'right' });
  doc.text(`Date: ${date}`, pageWidth - 14, 22, { align: 'right' });

  // Party Details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text(partyLabel + ':', 14, 45);
  doc.setFont(undefined, 'normal');
  doc.text(partyName || '-', 14, 52);
  if (partyCity) doc.text(`City: ${partyCity}`, 14, 58);
  if (partyPhone) doc.text(`Phone: ${partyPhone}`, 14, 64);

  // Status Badge
  doc.setFontSize(10);
  const statusColor = status === 'Paid' ? [22,163,74] : status === 'Partial' ? [217,119,6] : [220,38,38];
  doc.setTextColor(...statusColor);
  doc.setFont(undefined, 'bold');
  doc.text(`Status: ${status}`, pageWidth - 14, 45, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  // Items Table
  const tableRows = items.map((item, i) => [
    i + 1,
    item.ProductName || item.productName || '-',
    item.Quantity || item.quantity || 0,
    `Rs.${n(item.Rate || item.rate).toFixed(2)}`,
    `Rs.${n(item.Amount || item.amount).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['#', 'Product', 'Qty', 'Rate', 'Amount']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 12 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 35 },
      4: { halign: 'right', cellWidth: 35 },
    }
  });

  // Totals Section
  const finalY = doc.lastAutoTable.finalY + 10;
  const rightX = pageWidth - 14;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text('Total Amount:', rightX - 60, finalY);
  doc.text(`Rs.${n(total).toFixed(2)}`, rightX, finalY, { align: 'right' });

  doc.text(type === 'sale' ? 'Received:' : 'Paid:', rightX - 60, finalY + 7);
  doc.text(`Rs.${n(paid).toFixed(2)}`, rightX, finalY + 7, { align: 'right' });

  doc.setFont(undefined, 'bold');
  doc.setTextColor(...(n(balance) > 0 ? [220,38,38] : [22,163,74]));
  doc.text('Balance:', rightX - 60, finalY + 14);
  doc.text(`Rs.${n(balance).toFixed(2)}`, rightX, finalY + 14, { align: 'right' });

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text('Thank you for your business!', 14, doc.internal.pageSize.getHeight() - 15);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-PK')}`, 14, doc.internal.pageSize.getHeight() - 10);

  // Save
  doc.save(`${type === 'sale' ? 'Sale' : 'Purchase'}_Invoice_${invoiceNo}.pdf`);
}