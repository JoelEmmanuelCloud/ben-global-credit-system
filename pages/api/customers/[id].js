import dbConnect from '../../../lib/mongodb';
import Customer from '../../../models/Customer';
import Order from '../../../models/Order';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const customer = await Customer.findById(id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      
      // Get all orders for this customer
      const orders = await Order.find({ customerId: id }).sort({ createdAt: -1 });
      
      res.status(200).json({ success: true, customer, orders });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const customer = await Customer.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
      });
      
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      
      res.status(200).json({ success: true, customer });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const customer = await Customer.findByIdAndDelete(id);
      
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
      }
      
      // Delete all orders for this customer
      await Order.deleteMany({ customerId: id });
      
      res.status(200).json({ success: true, message: 'Customer deleted' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}