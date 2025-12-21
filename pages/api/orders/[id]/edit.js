// api/orders/[id]/edit.js
import dbConnect from '../../../../lib/mongodb';
import Order from '../../../../models/Order';
import Customer from '../../../../models/Customer';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'PUT') {
    try {
      const { products } = req.body;

      // Validate products
      if (!products || products.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'At least one product is required' 
        });
      }

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Calculate new total
      const processedProducts = products.map(product => ({
        name: product.name,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        totalPrice: product.quantity * product.unitPrice,
      }));

      const newTotalAmount = processedProducts.reduce(
        (sum, product) => sum + product.totalPrice,
        0
      );

      // Update order
      order.products = processedProducts;
      order.totalAmount = newTotalAmount;
      await order.save();

      // Recalculate customer's total debt and handle wallet deduction
      const customer = await Customer.findById(order.customerId);
      const allOrders = await Order.find({ customerId: order.customerId });
      const totalOrders = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalPaid = customer.payments ? customer.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

      let calculatedDebt = Math.max(0, (customer.oldBalance || 0) + totalOrders - totalPaid);

      // Deduct from wallet if available
      if (customer.wallet && customer.wallet > 0 && calculatedDebt > 0) {
        if (customer.wallet >= calculatedDebt) {
          // Wallet can cover full debt
          customer.wallet -= calculatedDebt;
          calculatedDebt = 0;
        } else {
          // Wallet can cover partial debt
          calculatedDebt -= customer.wallet;
          customer.wallet = 0;
        }
      }

      customer.totalDebt = calculatedDebt;
      await customer.save();

      const populatedOrder = await Order.findById(order._id).populate('customerId');
      res.status(200).json({ success: true, order: populatedOrder });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}