// api/orders/index.js
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Customer from '../../../models/Customer';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const orders = await Order.find({})
          .populate('customerId')
          .sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    case 'POST':
      try {
        const { customerId, products } = req.body;

        // Validate products
        if (!products || products.length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'At least one product is required' 
          });
        }

        // Calculate order total and prepare products
        const processedProducts = products.map(product => ({
          name: product.name,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
          totalPrice: product.quantity * product.unitPrice,
        }));

        const totalAmount = processedProducts.reduce(
          (sum, product) => sum + product.totalPrice,
          0
        );

        // Generate order number
        const orderCount = await Order.countDocuments();
        const orderNumber = `ORD-${String(orderCount + 1).padStart(5, '0')}`;

        // Create order
        const order = await Order.create({
          customerId,
          orderNumber,
          products: processedProducts,
          totalAmount,
        });

        // Get customer to calculate new totalDebt
        const customer = await Customer.findById(customerId);
        
        // Get all orders for this customer
        const allOrders = await Order.find({ customerId });
        const totalOrders = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalPaid = customer.payments ? customer.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
        
        // totalDebt = oldBalance + orders - payments
        const newTotalDebt = (customer.oldBalance || 0) + totalOrders - totalPaid;
        
        // Update customer's total debt
        await Customer.findByIdAndUpdate(customerId, {
          totalDebt: newTotalDebt,
        });

        const populatedOrder = await Order.findById(order._id).populate('customerId');

        res.status(201).json({ success: true, order: populatedOrder });
      } catch (error) {
        console.error('Order creation error:', error);
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}