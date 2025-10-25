import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';

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
      const order = await Order.findByIdAndDelete(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.status(200).json({ success: true, message: 'Order deleted' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}