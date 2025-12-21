// pages/api/orders/[id].js
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Customer from '../../../models/Customer';
import Return from '../../../models/Return';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const order = await Order.findById(id).populate('customerId');
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.status(200).json({ success: true, order });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const customerId = order.customerId;
      await Order.findByIdAndDelete(id);

      // Recalculate customer's total debt and wallet after deletion
      const customer = await Customer.findById(customerId);
      if (customer) {
        const allOrders = await Order.find({ customerId });
        const allReturns = await Return.find({ customerId });
        const totalOrders = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalReturns = allReturns.reduce((sum, r) => sum + r.totalAmount, 0);
        const totalPaid = customer.payments ? customer.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

        // Calculate net balance: if positive, it's prepaid (wallet); if negative, it's debt
        const netBalance = totalPaid - ((customer.oldBalance || 0) + totalOrders - totalReturns);

        if (netBalance >= 0) {
          customer.wallet = netBalance;
          customer.totalDebt = 0;
        } else {
          customer.wallet = 0;
          customer.totalDebt = Math.abs(netBalance);
        }

        await customer.save();
      }

      res.status(200).json({ success: true, message: 'Order deleted' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}