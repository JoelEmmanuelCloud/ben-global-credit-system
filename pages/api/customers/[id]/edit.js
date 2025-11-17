// api/customers/[id]/edit.js
import dbConnect from '../../../../lib/mongodb';
import Customer from '../../../../models/Customer';
import Order from '../../../../models/Order';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'PUT') {
    try {
      const { name, phone, email, address, oldBalance } = req.body;

      const customer = await Customer.findById(id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }

      // Update customer fields
      customer.name = name;
      customer.phone = phone;
      customer.email = email || '';
      customer.address = address || '';
      
      // Update oldBalance if provided
      if (oldBalance !== undefined) {
        customer.oldBalance = parseFloat(oldBalance) || 0;
      }

      // Recalculate totalDebt
      const allOrders = await Order.find({ customerId: id });
      const totalOrders = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalPaid = customer.payments ? customer.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
      
      customer.totalDebt = Math.max(0, (customer.oldBalance || 0) + totalOrders - totalPaid);
      
      await customer.save();

      res.status(200).json({ success: true, customer });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}