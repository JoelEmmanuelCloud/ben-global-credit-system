// api/customers/[id]/payment/[paymentId].js
import dbConnect from '../../../../../lib/mongodb';
import Customer from '../../../../../models/Customer';
import Order from '../../../../../models/Order';
import Return from '../../../../../models/Return';

export default async function handler(req, res) {
  const { id, paymentId } = req.query;
  await dbConnect();

  if (req.method === 'DELETE') {
    try {
      const customer = await Customer.findById(id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      // Find and remove the payment
      const paymentIndex = customer.payments.findIndex(
        p => p._id.toString() === paymentId
      );

      if (paymentIndex === -1) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      customer.payments.splice(paymentIndex, 1);

      // Recalculate totalDebt and wallet
      const allOrders = await Order.find({ customerId: id });
      const allReturns = await Return.find({ customerId: id });
      const totalOrders = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalReturns = allReturns.reduce((sum, r) => sum + r.totalAmount, 0);
      const totalPaid = customer.payments.reduce((sum, p) => sum + p.amount, 0);

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

      res.status(200).json({ success: true, customer });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { amount, note } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid payment amount' 
        });
      }

      const customer = await Customer.findById(id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      // Find the payment
      const payment = customer.payments.id(paymentId);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment not found' });
      }

      // Update payment
      payment.amount = parseFloat(amount);
      payment.note = note || '';

      // Recalculate totalDebt and wallet
      const allOrders = await Order.find({ customerId: id });
      const allReturns = await Return.find({ customerId: id });
      const totalOrders = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalReturns = allReturns.reduce((sum, r) => sum + r.totalAmount, 0);
      const totalPaid = customer.payments.reduce((sum, p) => sum + p.amount, 0);

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

      res.status(200).json({ success: true, customer });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}