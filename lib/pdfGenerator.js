import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateReceipt = (order, customer, type = 'order') => {
  const doc = new jsPDF();
  
  // Header - Company Info
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(26, 122, 82); // BGE Green
  doc.text('BEN GLOBAL ENTERPRISES (BGE)', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Merchandise • General Supplies', 105, 28, { align: 'center' });
  doc.text('18 Bishop Okoye Street, Opp. Mile 3 Market, Diobu, Port Harcourt', 105, 33, { align: 'center' });
  doc.text('Tel: 08068609964', 105, 38, { align: 'center' });
  
  // Line separator
  doc.setDrawColor(26, 122, 82);
  doc.setLineWidth(0.8);
  doc.line(15, 43, 195, 43);
  
  // Receipt Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(26, 122, 82);
  doc.text(type === 'payment' ? 'PAYMENT RECEIPT' : 'INVOICE', 105, 53, { align: 'center' });
  
  // Customer and Order Info Section
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  
  // Left side - Customer Info
  let yPos = 63;
  doc.setFont(undefined, 'bold');
  doc.text('CUSTOMER INFORMATION', 15, yPos);
  doc.setFont(undefined, 'normal');
  yPos += 6;
  doc.text(`Name: ${customer.name}`, 15, yPos);
  yPos += 5;
  doc.text(`Phone: ${customer.phone}`, 15, yPos);
  
  if (customer.address) {
    yPos += 5;
    const addressLines = doc.splitTextToSize(`Address: ${customer.address}`, 90);
    doc.text(addressLines, 15, yPos);
    yPos += (addressLines.length - 1) * 5;
  }
  
  // Right side - Order Info
  let rightYPos = 63;
  doc.setFont(undefined, 'bold');
  doc.text('ORDER DETAILS', 120, rightYPos, { align: 'left' });
  doc.setFont(undefined, 'normal');
  rightYPos += 6;
  doc.text('Order #:', 120, rightYPos);
  doc.text(order.orderNumber, 195, rightYPos, { align: 'right' });
  rightYPos += 5;
  doc.text('Date:', 120, rightYPos);
  doc.text(new Date(order.createdAt).toLocaleDateString('en-GB'), 195, rightYPos, { align: 'right' });
  
  // Products Table
  const startY = Math.max(yPos, rightYPos) + 10;
  
  // Format numbers without currency symbol for table (we'll add it in the header)
  const productRows = order.products.map(product => [
    product.name,
    product.quantity.toString(),
    product.unitPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    product.totalPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  ]);
  
  doc.autoTable({
    startY: startY,
    head: [['Product', 'Qty', 'Unit Price (₦)', 'Total (₦)']],
    body: productRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [26, 122, 82],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 80, halign: 'left' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 45, halign: 'right' },
      3: { cellWidth: 45, halign: 'right' }
    },
    styles: { 
      fontSize: 9,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });
  
  // Financial Summary
  let finalY = doc.lastAutoTable.finalY + 10;
  
  // Total Amount with proper alignment and ₦ symbol
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Total Amount:', 130, finalY);
  doc.text(`₦${order.totalAmount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 195, finalY, { align: 'right' });
  
  // Payment History Section
  if (order.payments && order.payments.length > 0) {
    finalY += 12;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(26, 122, 82);
    doc.text('PAYMENT HISTORY', 15, finalY);
    
    const paymentRows = order.payments.map(payment => [
      new Date(payment.date).toLocaleDateString('en-GB'),
      payment.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      payment.note || '-'
    ]);
    
    doc.autoTable({
      startY: finalY + 3,
      head: [['Date', 'Amount Paid (₦)', 'Note']],
      body: paymentRows,
      theme: 'grid',
      headStyles: { 
        fillColor: [26, 122, 82],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 30, halign: 'center' },
        1: { cellWidth: 40, halign: 'right' },
        2: { cellWidth: 120, halign: 'left' }
      },
      styles: { 
        fontSize: 9,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    finalY = doc.lastAutoTable.finalY + 10;
  } else {
    finalY += 8;
  }
  
  // Payment Summary Box with proper sizing
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(105, finalY - 5, 90, 25, 2, 2, 'FD');
  
  // Total Paid
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Total Paid:', 110, finalY + 2);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 128, 0);
  doc.text(`₦${order.amountPaid.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, finalY + 2, { align: 'right' });
  
  // Balance
  finalY += 8;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('BALANCE:', 110, finalY + 2);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  
  // Color code the balance
  if (order.balance > 0) {
    doc.setTextColor(220, 38, 38); // Red for outstanding balance
  } else {
    doc.setTextColor(22, 163, 74); // Green for paid in full
  }
  
  doc.text(`₦${order.balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 190, finalY + 2, { align: 'right' });
  
  finalY += 15;
  
  // Status Badge
  if (order.status === 'paid') {
    doc.setDrawColor(22, 163, 74);
    doc.setFillColor(220, 252, 231);
    doc.setTextColor(22, 163, 74);
  } else if (order.status === 'partial') {
    doc.setDrawColor(202, 138, 4);
    doc.setFillColor(254, 249, 195);
    doc.setTextColor(161, 98, 7);
  } else {
    doc.setDrawColor(220, 38, 38);
    doc.setFillColor(254, 226, 226);
    doc.setTextColor(220, 38, 38);
  }
  
  const statusText = order.status.toUpperCase();
  const statusWidth = doc.getTextWidth(statusText) + 12;
  const statusX = 105 - (statusWidth / 2);
  
  doc.roundedRect(statusX, finalY, statusWidth, 8, 1, 1, 'FD');
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(statusText, 105, finalY + 5.5, { align: 'center' });
  
  // Footer
  finalY += 18;
  
  // Separator line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, finalY, 195, finalY);
  
  finalY += 5;
  doc.setFontSize(10);
  doc.setTextColor(26, 122, 82);
  doc.setFont(undefined, 'bold');
  doc.text('Thank you for your business!', 105, finalY, { align: 'center' });
  
  finalY += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text('For inquiries, please contact us at 08068609964', 105, finalY, { align: 'center' });
  
  finalY += 4;
  doc.text('This is a computer-generated receipt and is valid without signature', 105, finalY, { align: 'center' });
  
  return doc;
};

export const downloadReceipt = (order, customer, type = 'order') => {
  const doc = generateReceipt(order, customer, type);
  const fileName = `${type}-${order.orderNumber}-${customer.name.replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
};

export const getReceiptBlob = (order, customer, type = 'order') => {
  const doc = generateReceipt(order, customer, type);
  return doc.output('blob');
};