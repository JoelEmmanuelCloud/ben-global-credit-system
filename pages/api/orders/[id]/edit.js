// api/orders/[id]/edit.js
import dbConnect from '../../../../lib/mongodb';
import Order from '../../../../models/Order';
import Customer from '../../../../models/Customer';
import Return from '../../../../models/Return';

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

      // Get customer's wallet balance before editing order
      const customer = await Customer.findById(order.customerId);
      const walletBeforeEdit = customer.wallet || 0;

      // Update order
      order.products = processedProducts;
      order.totalAmount = newTotalAmount;
      await order.save();

      // Recalculate customer's total debt and wallet
      const allOrders = await Order.find({ customerId: order.customerId });
      const allReturns = await Return.find({ customerId: order.customerId });
      const totalOrders = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const totalReturns = allReturns.reduce((sum, r) => sum + r.totalAmount, 0);
      const totalPaid = customer.payments ? customer.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

      // Calculate net balance: if positive, it's prepaid (wallet); if negative, it's debt
      const netBalance = totalPaid - ((customer.oldBalance || 0) + totalOrders - totalReturns);

      if (netBalance >= 0) {
        customer.wallet = netBalance;
        customer.totalDebt = 0;
      } else {
        customer.wallet = 0;
        customer.totalDebt = Math.abs(netBalance);
      }

      // Calculate how much wallet was used for this order
      const walletAfterEdit = customer.wallet || 0;
      const walletUsedForOrder = Math.max(0, walletBeforeEdit - walletAfterEdit);

      // Update the order with wallet used amount
      order.walletUsed = walletUsedForOrder;
      await order.save();

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