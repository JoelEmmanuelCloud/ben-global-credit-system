import dbConnect from '../../lib/mongodb';
import Order from '../../models/Order';
import Customer from '../../models/Customer';
import Return from '../../models/Return';

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

      order.payments.push({
        amount,
        date: new Date(),
        note: note || '',
      });

      order.amountPaid += amount;
      order.balance -= amount;

      if (order.balance === 0) {
        order.status = 'paid';
      } else if (order.amountPaid > 0) {
        order.status = 'partial';
      }

      await order.save();

      const customer = await Customer.findById(order.customerId);
      if (customer) {
        const allOrders = await Order.find({ customerId: customer._id });
        const allReturns = await Return.find({ customerId: customer._id });
        const totalOrders = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalReturns = allReturns.reduce((sum, r) => sum + r.totalAmount, 0);
        const totalPaid = customer.payments ? customer.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

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

      const populatedOrder = await Order.findById(order._id).populate('customerId');

      res.status(200).json({ success: true, order: populatedOrder });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
