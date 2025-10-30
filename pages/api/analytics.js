import dbConnect from '../../lib/mongodb';
import Customer from '../../models/Customer';
import Order from '../../models/Order';

export default async function handler(req, res) {
  await dbConnect();

  try {
    // Get all customers with their debt
    const customers = await Customer.find({})
      .sort({ totalDebt: -1 })
      .limit(10);

    // Get all orders for chart data
    const orders = await Order.find({});

    // Calculate stats
    const totalCustomers = await Customer.countDocuments();
    const totalOrders = orders.length;
    
    // Calculate total debt across all customers
    const allCustomers = await Customer.find({});
    const totalDebt = allCustomers.reduce((sum, customer) => sum + customer.totalDebt, 0);
    
    // Count customers with debt
    const customersWithDebt = await Customer.countDocuments({ totalDebt: { $gt: 0 } });

    // Calculate order status counts based on customer debt
    let paidOrders = 0;
    let partialOrders = 0;
    let unpaidOrders = 0;

    for (const customer of allCustomers) {
      const customerOrders = await Order.find({ customerId: customer._id });
      const totalOrderAmount = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalPaid = customer.payments ? customer.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

      if (customerOrders.length > 0) {
        if (totalPaid === 0 && totalOrderAmount > 0) {
          unpaidOrders += customerOrders.length;
        } else if (totalPaid >= totalOrderAmount) {
          paidOrders += customerOrders.length;
        } else if (totalPaid > 0 && totalPaid < totalOrderAmount) {
          partialOrders += customerOrders.length;
        }
      }
    }

    // Prepare chart data for last 12 months
    const chartData = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear();
      
      // Get orders for this month
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });

      // Calculate debt issued this month (total of all orders)
      const debtIssued = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);

      // Calculate payments made this month across all customers
      let paymentsMade = 0;
      for (const customer of allCustomers) {
        if (customer.payments) {
          const monthPayments = customer.payments.filter(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate >= monthStart && paymentDate <= monthEnd;
          });
          paymentsMade += monthPayments.reduce((sum, p) => sum + p.amount, 0);
        }
      }

      chartData.push({
        name: `${monthName} ${year}`,
        debt: debtIssued,
        paid: paymentsMade,
      });
    }

    res.status(200).json({
      success: true,
      stats: {
        totalCustomers,
        totalOrders,
        totalDebt,
        customersWithDebt,
        paidOrders,
        partialOrders,
        unpaidOrders,
      },
      customers: customers.map(c => ({
        _id: c._id,
        name: c.name,
        totalDebt: c.totalDebt,
      })),
      chartData,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
}