// api/customers/[id].js
import dbConnect from '../../../lib/dbConnect';
import Customer from '../../../models/Customer';
import Order from '../../../models/Order';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const customer = await Customer.findById(id);
        const orders = await Order.find({ customerId: id }).sort({ createdAt: -1 });
        
        if (!customer) {
          return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        res.status(200).json({ success: true, customer, orders });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    case 'PUT':
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
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    case 'DELETE':
      try {
        const deletedCustomer = await Customer.deleteOne({ _id: id });
        
        if (!deletedCustomer) {
          return res.status(404).json({ success: false, message: 'Customer not found' });
        }

        // Delete all orders for this customer
        await Order.deleteMany({ customerId: id });

        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}