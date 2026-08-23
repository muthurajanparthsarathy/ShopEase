import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, User } from '../../core/models';
import { formatDate } from '../../core/utils/format.utils';

const inr = (n: number) => 'Rs. ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function downloadInvoice(order: Order, user: User | null): void {
  const doc = new jsPDF();

  doc.setFontSize(20); doc.setTextColor(37, 99, 235); doc.text('ShopEase', 14, 20);
  doc.setFontSize(10); doc.setTextColor(100); doc.text('Tax Invoice', 14, 26);
  doc.setTextColor(0); doc.setFontSize(11);
  doc.text(`Invoice No: ${order.orderNumber}`, 200, 20, { align: 'right' });
  doc.text(`Date: ${formatDate(order.createdAt)}`, 200, 26, { align: 'right' });
  doc.text(`Status: ${order.status}`, 200, 32, { align: 'right' });

  doc.setFontSize(10); doc.setTextColor(80);
  doc.text('Bill To:', 14, 40);
  doc.setTextColor(0);
  doc.text(user?.name || '', 14, 45);
  const addr = order.address;
  doc.text(`${addr.line}, ${addr.city}`, 14, 50);
  doc.text(`${addr.state} - ${addr.postalCode}`, 14, 55);

  autoTable(doc, {
    startY: 62,
    head: [['Product', 'Price', 'Qty', 'Subtotal']],
    body: order.items.map((it) => [it.name, inr(it.price), String(it.quantity), inr(it.subtotal)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
  });

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  const right = 200, labelX = 150;
  doc.setFontSize(10);
  doc.text('Subtotal:', labelX, y); doc.text(inr(order.subtotal), right, y, { align: 'right' }); y += 6;
  doc.text('Tax:', labelX, y); doc.text(inr(order.tax), right, y, { align: 'right' }); y += 6;
  doc.text('Shipping:', labelX, y); doc.text(order.shipping === 0 ? 'FREE' : inr(order.shipping), right, y, { align: 'right' }); y += 7;
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('Total:', labelX, y); doc.text(inr(order.total), right, y, { align: 'right' });

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120);
  doc.text('Thank you for shopping with ShopEase!', 14, 285);
  doc.save(`Invoice_${order.orderNumber}.pdf`);
}
