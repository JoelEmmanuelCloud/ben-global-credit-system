// pages/api/orders/[id].js
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Customer from '../../../models/Customer';

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

      // Recalculate customer's total debt after deletion
      const customer = await Customer.findById(customerId);
      if (customer) {
        const allOrders = await Order.find({ customerId });
        const totalOrders = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalPaid = customer.payments ? customer.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

        const calculatedDebt = (customer.oldBalance || 0) + totalOrders - totalPaid;

        // If debt is negative after deleting order, add surplus to wallet
        if (calculatedDebt < 0) {
          const surplus = Math.abs(calculatedDebt);
          customer.wallet = (customer.wallet || 0) + surplus;
          customer.totalDebt = 0;
        } else {
          customer.totalDebt = calculatedDebt;
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