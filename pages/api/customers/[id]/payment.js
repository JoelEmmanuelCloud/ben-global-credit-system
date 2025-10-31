// api/customers/[id]/payment.js
import dbConnect from '../../../../lib/mongodb';
import Customer from '../../../../models/Customer';
import Order from '../../../../models/Order';

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

        // Check if payment exceeds total debt
        if (amount > customer.totalDebt) {
          return res.status(400).json({ 
            success: false, 
            message: `Payment amount (₦${amount.toLocaleString()}) cannot exceed total debt (₦${customer.totalDebt.toLocaleString()})` 
          });
        }

        // Add payment to customer
        customer.payments.push({
          amount: parseFloat(amount),
          date: new Date(),
          note: note || '',
        });

        // Recalculate totalDebt: oldBalance + orders - payments
        const allOrders = await Order.find({ customerId: id });
        const totalOrders = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalPaid = customer.payments.reduce((sum, p) => sum + p.amount, 0);
        
        customer.totalDebt = Math.max(0, (customer.oldBalance || 0) + totalOrders - totalPaid);

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