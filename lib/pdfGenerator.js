import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateCustomerReceipt = (customer, orders) => {
  const doc = new jsPDF();
  
  // Helper function to format numbers with commas
  const formatNumber = (num) => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
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
  doc.text('CUSTOMER STATEMENT', 105, 53, { align: 'center' });
  
  // Customer Info Section
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  
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
  
  // Statement Date
  let rightYPos = 63;
  doc.setFont(undefined, 'bold');
  doc.text('STATEMENT DATE', 120, rightYPos, { align: 'left' });
  doc.setFont(undefined, 'normal');
  rightYPos += 6;
  doc.text(new Date().toLocaleDateString('en-GB'), 120, rightYPos);
  
  yPos = Math.max(yPos, rightYPos) + 10;
  
  // Old Balance Section (if exists)
  if (customer.oldBalance && customer.oldBalance > 0) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(202, 138, 4); // Orange color
    doc.text('OLD BALANCE (BEFORE SYSTEM)', 15, yPos);
    
    doc.setDrawColor(202, 138, 4);
    doc.setFillColor(254, 249, 195);
    doc.roundedRect(120, yPos - 5, 75, 10, 2, 2, 'FD');
    
    doc.setFontSize(13);
    doc.setTextColor(161, 98, 7);
    doc.text('N' + formatNumber(customer.oldBalance), 190, yPos + 2, { align: 'right' });
    
    yPos += 15;
    doc.setTextColor(0, 0, 0);
  }
  
  // Orders Section
  if (orders && orders.length > 0) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(26, 122, 82);
    doc.text('ORDER HISTORY', 15, yPos);
    
    // Sort orders by date (oldest first)
    const sortedOrders = [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    const orderRows = sortedOrders.map(order => {
      const productsList = order.products.map(p => `${p.name} (x${p.quantity})`).join(', ');
      return [
        order.orderNumber,
        new Date(order.createdAt).toLocaleDateString('en-GB'),
        productsList,
        'N' + formatNumber(order.totalAmount)
      ];
    });
    
    doc.autoTable({
      startY: yPos + 3,
      head: [['Order #', 'Date', 'Products', 'Amount']],
      body: orderRows,
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
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 85, halign: 'left' },
        3: { cellWidth: 45, halign: 'right' }
      },
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  }
  
  // Payment History Section
  if (customer.payments && customer.payments.length > 0) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(26, 122, 82);
    doc.text('PAYMENT HISTORY', 15, yPos);
    
    // Sort payments by date (oldest first)
    const sortedPayments = [...customer.payments].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const paymentRows = sortedPayments.map(payment => [
      new Date(payment.date).toLocaleDateString('en-GB'),
      'N' + formatNumber(payment.amount),
      payment.note || '-'
    ]);
    
    doc.autoTable({
      startY: yPos + 3,
      head: [['Date', 'Amount Paid', 'Note']],
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
        1: { cellWidth: 48, halign: 'right' },
        2: { cellWidth: 112, halign: 'left' }
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
    
    yPos = doc.lastAutoTable.finalY + 10;
  } else {
    yPos += 8;
  }
  
  // Financial Summary
  const oldBalance = customer.oldBalance || 0;
  const totalOrders = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalPaid = customer.payments ? customer.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
  const balance = customer.totalDebt;
  
  // Summary Box - taller if oldBalance exists
  const boxHeight = oldBalance > 0 ? 43 : 35;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(112, yPos - 5, 83, boxHeight, 2, 2, 'FD');
  
  let summaryY = yPos + 2;
  
  // Old Balance (if exists)
  if (oldBalance > 0) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Old Balance:', 117, summaryY);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(202, 138, 4);
    doc.text('N' + formatNumber(oldBalance), 190, summaryY, { align: 'right' });
    summaryY += 8;
  }
  
  // Total Orders
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Total Orders:', 117, summaryY);
  doc.setFont(undefined, 'bold');
  doc.text('N' + formatNumber(totalOrders), 190, summaryY, { align: 'right' });
  
  // Total Paid
  summaryY += 8;
  doc.setFont(undefined, 'normal');
  doc.text('Total Paid:', 117, summaryY);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 128, 0);
  doc.text('N' + formatNumber(totalPaid), 190, summaryY, { align: 'right' });
  
  // Balance
  summaryY += 8;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('BALANCE:', 117, summaryY);
  doc.setFontSize(13);
  
  // Color code the balance
  if (balance > 0) {
    doc.setTextColor(220, 38, 38); // Red for outstanding balance
  } else {
    doc.setTextColor(22, 163, 74); // Green for paid in full
  }
  
  doc.text('N' + formatNumber(balance), 190, summaryY, { align: 'right' });
  
  yPos = summaryY + 10;
  
  // Status Badge
  let status = 'unpaid';
  if (balance === 0) {
    status = 'paid';
  } else if (totalPaid > 0) {
    status = 'partial';
  }
  
  if (status === 'paid') {
    doc.setDrawColor(22, 163, 74);
    doc.setFillColor(220, 252, 231);
    doc.setTextColor(22, 163, 74);
  } else if (status === 'partial') {
    doc.setDrawColor(202, 138, 4);
    doc.setFillColor(254, 249, 195);
    doc.setTextColor(161, 98, 7);
  } else {
    doc.setDrawColor(220, 38, 38);
    doc.setFillColor(254, 226, 226);
    doc.setTextColor(220, 38, 38);
  }
  
  const statusText = status.toUpperCase();
  const statusWidth = doc.getTextWidth(statusText) + 12;
  const statusX = 105 - (statusWidth / 2);
  
  doc.roundedRect(statusX, yPos, statusWidth, 8, 1, 1, 'FD');
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(statusText, 105, yPos + 5.5, { align: 'center' });
  
  // Footer
  yPos += 18;
  
  // Separator line
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, yPos, 195, yPos);
  
  yPos += 5;
  doc.setFontSize(10);
  doc.setTextColor(26, 122, 82);
  doc.setFont(undefined, 'bold');
  doc.text('Thank you for your business!', 105, yPos, { align: 'center' });
  
  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text('For inquiries, please contact us at 08068609964', 105, yPos, { align: 'center' });
  
  yPos += 4;
  doc.text('This is a computer-generated statement and is valid without signature', 105, yPos, { align: 'center' });
  
  return doc;
};

export const downloadCustomerReceipt = (customer, orders) => {
  const doc = generateCustomerReceipt(customer, orders);
  const fileName = `statement-${customer.name.replace(/\s+/g, '-')}-${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};

export const getCustomerReceiptBlob = (customer, orders) => {
  const doc = generateCustomerReceipt(customer, orders);
  return doc.output('blob');
};