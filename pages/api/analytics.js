import dbConnect from '../../lib/mongodb';
import Order from '../../models/Order';
import Customer from '../../models/Customer';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      // Get all customers with debt
      const customers = await Customer.find({ totalDebt: { $gt: 0 } })
        .select('name totalDebt')
        .sort({ totalDebt: -1 });
      
      // Get total debt
      const totalDebt = customers.reduce((sum, customer) => sum + customer.totalDebt, 0);
      
      // Get monthly debt data for the last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      
      const orders = await Order.find({
        createdAt: { $gte: twelveMonthsAgo },
      });
      
      // Group by month
      const monthlyData = {};
      const months = [];
      
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        monthlyData[monthKey] = {
          name: monthName,
          debt: 0,
          paid: 0,
        };
        months.push(monthKey);
      }
      
      // Calculate monthly debts
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].debt += order.totalAmount;
          monthlyData[monthKey].paid += order.amountPaid;
        }
      });
      
      const chartData = months.map(month => monthlyData[month]);
      
      // Get statistics
      const stats = {
        totalCustomers: await Customer.countDocuments(),
        customersWithDebt: customers.length,
        totalDebt,
        totalOrders: await Order.countDocuments(),
        unpaidOrders: await Order.countDocuments({ status: 'unpaid' }),
        partialOrders: await Order.countDocuments({ status: 'partial' }),
        paidOrders: await Order.countDocuments({ status: 'paid' }),
      };
      
      res.status(200).json({
        success: true,
        stats,
        customers,
        chartData,
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}