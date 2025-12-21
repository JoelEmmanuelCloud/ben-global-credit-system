// api/customers/[id]/payment.js
import dbConnect from '../../../../lib/mongodb';
import Customer from '../../../../models/Customer';
import Order from '../../../../models/Order';
import Return from '../../../../models/Return';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  switch (method) {
    case 'POST':
      try {
        const { amount, note } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid payment amount' 
          });
        }

        // Get customer
        const customer = await Customer.findById(id);
        if (!customer) {
          return res.status(404).json({
            success: false,
            message: 'Customer not found'
          });
        }

        // Add payment to customer
        customer.payments.push({
          amount: parseFloat(amount),
          date: new Date(),
          note: note || '',
        });

        // Recalculate totalDebt: oldBalance + orders - returns - payments
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

        res.status(200).json({ 
          success: true, 
          customer,
          message: 'Payment recorded successfully'
        });
      } catch (error) {
        console.error('Payment error:', error);
        res.status(400).json({ 
          success: false, 
          message: error.message 
        });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}