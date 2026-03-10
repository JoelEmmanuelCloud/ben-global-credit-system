import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateCustomerReceipt = (customer, orders, options = {}) => {
  const doc = new jsPDF();
  const { periodLabel } = options;
  const isFiltered = !!periodLabel && periodLabel !== 'All Time';

  const formatNumber = (num) => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(26, 122, 82);
  doc.text('BEN GLOBAL ENTERPRISES (BGE)', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Merchandise • General Supplies', 105, 28, { align: 'center' });
  doc.text('18 Bishop Okoye Street, Opp. Mile 3 Market, Diobu, Port Harcourt', 105, 33, { align: 'center' });
  doc.text('Tel: 08068609964', 105, 38, { align: 'center' });

  doc.setDrawColor(26, 122, 82);
  doc.setLineWidth(0.8);
  doc.line(15, 43, 195, 43);

  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(26, 122, 82);
  doc.text('CUSTOMER STATEMENT', 105, 53, { align: 'center' });

  if (isFiltered) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(`Period: ${periodLabel}`, 105, 60, { align: 'center' });
  }

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);

  let yPos = isFiltered ? 70 : 63;
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

  let rightYPos = isFiltered ? 70 : 63;
  doc.setFont(undefined, 'bold');
  doc.text('STATEMENT DATE', 120, rightYPos, { align: 'left' });
  doc.setFont(undefined, 'normal');
  rightYPos += 6;
  doc.text(new Date().toLocaleDateString('en-GB'), 120, rightYPos);
  if (isFiltered) {
    rightYPos += 5;
    doc.setFont(undefined, 'bold');
    doc.setTextColor(26, 122, 82);
    doc.text('PERIOD', 120, rightYPos, { align: 'left' });
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    rightYPos += 5;
    const periodLines = doc.splitTextToSize(periodLabel, 70);
    doc.text(periodLines, 120, rightYPos);
    rightYPos += (periodLines.length - 1) * 5;
  }

  yPos = Math.max(yPos, rightYPos) + 10;

  if (!isFiltered && customer.oldBalance && customer.oldBalance > 0) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(202, 138, 4);
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

  if (orders && orders.length > 0) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(26, 122, 82);
    doc.text('ORDER HISTORY', 15, yPos);

    const sortedOrders = [...orders].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    yPos += 5;

    sortedOrders.forEach((order, orderIndex) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(26, 122, 82);
      doc.text(`Order ${order.orderNumber}`, 15, yPos);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(new Date(order.createdAt).toLocaleDateString('en-GB'), 120, yPos, { align: 'left' });

      const productRows = order.products.map(p => [
        p.name,
        p.quantity.toString(),
        'N' + formatNumber(p.unitPrice),
        'N' + formatNumber(p.totalPrice)
      ]);

      const footerRows = [['', '', 'Order Total:', 'N' + formatNumber(order.totalAmount)]];
      if (order.walletUsed && order.walletUsed > 0) {
        footerRows.push(['', '', 'Paid from Wallet:', 'N' + formatNumber(order.walletUsed)]);
      }

      doc.autoTable({
        startY: yPos + 2,
        head: [['Product', 'Qty', 'Unit Price', 'Total']],
        body: productRows,
        foot: footerRows,
        theme: 'striped',
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [60, 60, 60],
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        footStyles: {
          fillColor: [26, 122, 82],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'right'
        },
        columnStyles: {
          0: { cellWidth: 85, halign: 'left' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 40, halign: 'right' },
          3: { cellWidth: 40, halign: 'right' }
        },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [220, 220, 220],
          lineWidth: 0.1
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        margin: { left: 15, right: 15 }
      });

      yPos = doc.lastAutoTable.finalY + 5;

      if (orderIndex < sortedOrders.length - 1) {
        yPos += 3;
      }
    });

    yPos += 5;
  }

  if (yPos > 220 && customer.payments && customer.payments.length > 0) {
    doc.addPage();
    yPos = 20;
  }

  if (customer.payments && customer.payments.length > 0) {
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(26, 122, 82);
    doc.text('PAYMENT HISTORY', 15, yPos);

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
      },
      margin: { left: 15, right: 15 }
    });

    yPos = doc.lastAutoTable.finalY + 10;
  } else {
    yPos += 8;
  }

  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }

  const oldBalance = isFiltered ? 0 : (customer.oldBalance || 0);
  const totalOrders = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalPaid = customer.payments ? customer.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
  const balance = isFiltered ? Math.max(0, totalOrders - totalPaid) : customer.totalDebt;
  const walletBalance = isFiltered ? 0 : (customer.wallet || 0);

  let boxHeight = 35;
  if (oldBalance > 0) boxHeight += 8;
  if (walletBalance > 0) boxHeight += 8;
  if (isFiltered) boxHeight += 8;

  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(112, yPos - 5, 83, boxHeight, 2, 2, 'FD');

  let summaryY = yPos + 2;

  if (isFiltered) {
    doc.setFontSize(8);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(100, 100, 100);
    const periodLines = doc.splitTextToSize(`Period: ${periodLabel}`, 70);
    doc.text(periodLines, 117, summaryY);
    summaryY += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
  }

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

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Total Orders:', 117, summaryY);
  doc.setFont(undefined, 'bold');
  doc.text('N' + formatNumber(totalOrders), 190, summaryY, { align: 'right' });

  summaryY += 8;
  doc.setFont(undefined, 'normal');
  doc.text('Total Paid:', 117, summaryY);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 128, 0);
  doc.text('N' + formatNumber(totalPaid), 190, summaryY, { align: 'right' });

  summaryY += 8;
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('BALANCE:', 117, summaryY);
  doc.setFontSize(13);

  if (balance > 0) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(22, 163, 74);
  }

  doc.text('N' + formatNumber(balance), 190, summaryY, { align: 'right' });

  if (walletBalance > 0) {
    summaryY += 8;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('Wallet:', 117, summaryY);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(128, 90, 213);
    doc.text('N' + formatNumber(walletBalance), 190, summaryY, { align: 'right' });
  }

  yPos = summaryY + 10;

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

  yPos += 18;

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

export const downloadCustomerReceipt = (customer, orders, options = {}) => {
  const doc = generateCustomerReceipt(customer, orders, options);
  const { periodLabel } = options;
  const periodSuffix = periodLabel && periodLabel !== 'All Time'
    ? `-${periodLabel.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-')}`
    : '';
  const fileName = `statement-${customer.name.replace(/\s+/g, '-')}${periodSuffix}-${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};

export const getCustomerReceiptBlob = (customer, orders) => {
  const doc = generateCustomerReceipt(customer, orders);
  return doc.output('blob');
};

const getCategoryLabel = (category) => {
  const labels = {
    operating: 'Operating',
    inventory: 'Inventory',
    tax: 'Tax',
    labour_transport: 'Labour/Trans',
    other: 'Other'
  };
  return labels[category] || category;
};

export const generateExpenseReport = (expenses, filters = {}) => {
  const doc = new jsPDF();

  const formatNumber = (num) => {
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(26, 122, 82);
  doc.text('BEN GLOBAL ENTERPRISES (BGE)', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Merchandise • General Supplies', 105, 28, { align: 'center' });
  doc.text('18 Bishop Okoye Street, Opp. Mile 3 Market, Diobu, Port Harcourt', 105, 33, { align: 'center' });
  doc.text('Tel: 08068609964', 105, 38, { align: 'center' });

  doc.setDrawColor(26, 122, 82);
  doc.setLineWidth(0.8);
  doc.line(15, 43, 195, 43);

  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(26, 122, 82);
  doc.text('EXPENSE REPORT', 105, 53, { align: 'center' });

  let yPos = 63;
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);

  if (filters.startDate || filters.endDate) {
    const startStr = filters.startDate ? new Date(filters.startDate).toLocaleDateString('en-GB') : 'Beginning';
    const endStr = filters.endDate ? new Date(filters.endDate).toLocaleDateString('en-GB') : 'Today';
    doc.text(`Period: ${startStr} to ${endStr}`, 105, yPos, { align: 'center' });
    yPos += 8;
  } else {
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, 105, yPos, { align: 'center' });
    yPos += 8;
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalVat = expenses.reduce((sum, exp) => sum + (exp.vatAmount || 0), 0);
  const taxDeductible = expenses
    .filter(exp => exp.isTaxDeductible)
    .reduce((sum, exp) => sum + exp.amount, 0);

  doc.setFillColor(250, 250, 250);
  doc.roundedRect(15, yPos, 180, 30, 2, 2, 'F');

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Total Expenses', 20, yPos + 8);
  doc.text('Total VAT', 80, yPos + 8);
  doc.text('Tax Deductible', 140, yPos + 8);

  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('N' + formatNumber(totalExpenses), 20, yPos + 16);
  doc.text('N' + formatNumber(totalVat), 80, yPos + 16);
  doc.text('N' + formatNumber(taxDeductible), 140, yPos + 16);

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`${expenses.length} transactions`, 20, yPos + 23);

  yPos += 40;

  const tableRows = expenses.map(exp => [
    new Date(exp.date).toLocaleDateString('en-GB'),
    exp.description.substring(0, 35) + (exp.description.length > 35 ? '...' : ''),
    getCategoryLabel(exp.category),
    exp.vendorName || '-',
    'N' + formatNumber(exp.amount),
    exp.vatAmount ? 'N' + formatNumber(exp.vatAmount) : '-',
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['Date', 'Description', 'Category', 'Vendor', 'Amount', 'VAT']],
    body: tableRows,
    foot: [['', '', '', 'TOTAL:', 'N' + formatNumber(totalExpenses), 'N' + formatNumber(totalVat)]],
    theme: 'grid',
    headStyles: {
      fillColor: [26, 122, 82],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center'
    },
    footStyles: {
      fillColor: [26, 122, 82],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'right'
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 52, halign: 'left' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 35, halign: 'left' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 25, halign: 'right' }
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    margin: { left: 15, right: 15 }
  });

  yPos = doc.lastAutoTable.finalY + 10;

  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, yPos, 195, yPos);

  yPos += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'normal');
  doc.text('This is a computer-generated report and is valid without signature', 105, yPos, { align: 'center' });

  return doc;
};

export const downloadExpenseReport = (expenses, filters = {}) => {
  const doc = generateExpenseReport(expenses, filters);
  const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  const fileName = `expense-report-${dateStr}.pdf`;
  doc.save(fileName);
};
