import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Customer from '../../../models/Customer';

// Generate order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `BGE-${timestamp.slice(-6)}${random}`;
};

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { customerId, startDate, endDate } = req.query;
      
      let query = {};
      
      if (customerId) {
        query.customerId = customerId;
      }
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      const orders = await Order.find(query)
        .populate('customerId', 'name phone')
        .sort({ createdAt: -1 });
      
      res.status(200).json({ success: true, orders });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { customerId, products } = req.body;
      
      // Calculate totals
      const totalAmount = products.reduce((sum, product) => {
        return sum + (product.quantity * product.unitPrice);
      }, 0);
      
      // Add totalPrice to each product
      const productsWithTotal = products.map(product => ({
        ...product,
        totalPrice: product.quantity * product.unitPrice,
      }));
      
      // Create order
      const order = await Order.create({
        customerId,
        orderNumber: generateOrderNumber(),
        products: productsWithTotal,
        totalAmount,
        amountPaid: 0,
        balance: totalAmount,
        status: 'unpaid',
      });
      
      // Update customer total debt
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalDebt: totalAmount },
      });
      
      const populatedOrder = await Order.findById(order._id).populate('customerId', 'name phone address email');
      
      res.status(201).json({ success: true, order: populatedOrder });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}