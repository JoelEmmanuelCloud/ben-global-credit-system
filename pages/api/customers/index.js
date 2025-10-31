//pages/api/customers/index.js
import dbConnect from '../../../lib/mongodb';
import Customer from '../../../models/Customer';
import Order from '../../../models/Order';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const customers = await Customer.find({}).sort({ createdAt: -1 });
        
        // Calculate totalDebt for each customer (oldBalance + orders - payments)
        const customersWithDebt = await Promise.all(
          customers.map(async (customer) => {
            const orders = await Order.find({ customerId: customer._id });
            const totalOrders = orders.reduce((sum, order) => sum + order.totalAmount, 0);
            const totalPaid = customer.payments ? customer.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
            
            // totalDebt = oldBalance + orders - payments
            const calculatedDebt = (customer.oldBalance || 0) + totalOrders - totalPaid;
            
            // Update if different
            if (customer.totalDebt !== calculatedDebt) {
              await Customer.findByIdAndUpdate(customer._id, { totalDebt: calculatedDebt });
            }
            
            return {
              ...customer.toObject(),
              totalDebt: calculatedDebt
            };
          })
        );
        
        res.status(200).json({ success: true, customers: customersWithDebt });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    case 'POST':
      try {
        const { oldBalance, ...customerData } = req.body;
        
        // Create customer with oldBalance
        const customer = await Customer.create({
          ...customerData,
          oldBalance: parseFloat(oldBalance) || 0,
          totalDebt: parseFloat(oldBalance) || 0, // Initial totalDebt is just oldBalance
        });
        
        res.status(201).json({ success: true, customer });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}


















