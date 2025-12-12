// pages/api/Payment.js
import dbConnect from '../../lib/mongodb';
import Order from '../../models/Order';
import Customer from '../../models/Customer';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const { amount, note } = req.body;
      
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      
      if (amount <= 0) {
        return res.status(400).json({ success: false, message: 'Payment amount must be greater than zero' });
      }
      
      if (amount > order.balance) {
        return res.status(400).json({ success: false, message: 'Payment amount exceeds order balance' });
      }
      
      // Add payment to order
      order.payments.push({
        amount,
        date: new Date(),
        note: note || '',
      });
      
      // Update order amounts
      const oldBalance = order.balance;
      order.amountPaid += amount;
      order.balance -= amount;
      
      // Update status
      if (order.balance === 0) {
        order.status = 'paid';
      } else if (order.amountPaid > 0) {
        order.status = 'partial';
      }
      
      await order.save();
      
      // Update customer total debt
      await Customer.findByIdAndUpdate(order.customerId, {
        $inc: { totalDebt: -amount },
      });
      
      const populatedOrder = await Order.findById(order._id).populate('customerId');
      
      res.status(200).json({ success: true, order: populatedOrder });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}