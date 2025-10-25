import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateReceipt = (order, customer, type = 'order') => {
  const doc = new jsPDF();
  
  // Add logo
  const logoData = '/logo.png'; // We'll handle this separately
  
  // Header - Company Info
  doc.setFontSize(20);
  doc.setTextColor(26, 122, 82); // BGE Green
  doc.text('BEN GLOBAL ENTERPRISES (BGE)', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('Merchandise • General Supplies', 105, 27, { align: 'center' });
  doc.text('18 Bishop Okoye Street, Opp. Mile 3 Market, Diobu, Port Harcourt', 105, 32, { align: 'center' });
  doc.text('Tel: 08068609964', 105, 37, { align: 'center' });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, 42, 190, 42);
  
  // Receipt Title
  doc.setFontSize(16);
  doc.setTextColor(26, 122, 82);
  doc.text(type === 'payment' ? 'PAYMENT RECEIPT' : 'INVOICE', 105, 52, { align: 'center' });
  
  // Customer and Order Info
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Customer: ${customer.name}`, 20, 62);
  doc.text(`Phone: ${customer.phone}`, 20, 68);
  if (customer.address) {
    doc.text(`Address: ${customer.address}`, 20, 74);
  }
  
  doc.text(`Order #: ${order.orderNumber}`, 140, 62);
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 140, 68);
  
  // Products Table
  const startY = customer.address ? 82 : 76;
  
  const productRows = order.products.map(product => [
    product.name,
    product.quantity.toString(),
    `₦${product.unitPrice.toLocaleString()}`,
    `₦${product.totalPrice.toLocaleString()}`
  ]);
  
  doc.autoTable({
    startY: startY,
    head: [['Product', 'Quantity', 'Unit Price', 'Total']],
    body: productRows,
    theme: 'striped',
    headStyles: { fillColor: [26, 122, 82] },
    styles: { fontSize: 9 },
  });
  
  // Totals Section
  let finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.text(`Total Amount:`, 120, finalY);
  doc.text(`₦${order.totalAmount.toLocaleString()}`, 170, finalY, { align: 'right' });
  
  // Payment History
  if (order.payments && order.payments.length > 0) {
    finalY += 10;
    doc.setFontSize(12);
    doc.setTextColor(26, 122, 82);
    doc.text('Payment History:', 20, finalY);
    
    const paymentRows = order.payments.map(payment => [
      new Date(payment.date).toLocaleDateString(),
      `₦${payment.amount.toLocaleString()}`,
      payment.note || '-'
    ]);
    
    doc.autoTable({
      startY: finalY + 5,
      head: [['Date', 'Amount Paid', 'Note']],
      body: paymentRows,
      theme: 'striped',
      headStyles: { fillColor: [26, 122, 82] },
      styles: { fontSize: 9 },
    });
    
    finalY = doc.lastAutoTable.finalY + 10;
  }
  
  // Summary
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Paid:`, 120, finalY);
  doc.text(`₦${order.amountPaid.toLocaleString()}`, 170, finalY, { align: 'right' });
  
  finalY += 7;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(order.balance > 0 ? 200 : 0, order.balance > 0 ? 0 : 150, 0);
  doc.text(`Balance:`, 120, finalY);
  doc.text(`₦${order.balance.toLocaleString()}`, 170, finalY, { align: 'right' });
  
  // Footer
  finalY += 15;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text('Thank you for your business!', 105, finalY, { align: 'center' });
  
  finalY += 5;
  doc.text('For inquiries, please contact us at 08068609964', 105, finalY, { align: 'center' });
  
  return doc;
};

export const downloadReceipt = (order, customer, type = 'order') => {
  const doc = generateReceipt(order, customer, type);
  doc.save(`${type}-${order.orderNumber}-${customer.name}.pdf`);
};

export const getReceiptBlob = (order, customer, type = 'order') => {
  const doc = generateReceipt(order, customer, type);
  return doc.output('blob');
};