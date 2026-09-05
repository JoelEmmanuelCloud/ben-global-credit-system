import mongoose from 'mongoose';
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Customer from '../../../models/Customer';
import Product from '../../../models/Product';
import Return from '../../../models/Return';
import { escapeRegex } from '../../../lib/regexEscape';

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
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const order = await Order.findById(id).session(session);
        if (!order) {
          throw new Error('Order not found');
        }

        const customerId = order.customerId;

        for (const item of order.products) {
          const inventoryProduct = await Product.findOne({
            name: { $regex: new RegExp(`^${escapeRegex(item.name)}$`, 'i') }
          }).session(session);

          if (!inventoryProduct) continue;

          const previousStock = inventoryProduct.currentStock;
          const newStock = previousStock + item.quantity;

          inventoryProduct.stockHistory.push({
            type: 'addition',
            quantity: item.quantity,
            previousStock,
            newStock,
            reason: `Order ${order.orderNumber} deleted`,
            orderId: order._id,
          });

          inventoryProduct.currentStock = newStock;
          await inventoryProduct.save({ session });
        }

        await Order.findByIdAndDelete(id).session(session);

        const customer = await Customer.findById(customerId).session(session);
        if (customer) {
          const allOrders = await Order.find({ customerId }).session(session);
          const allReturns = await Return.find({ customerId }).session(session);
          const totalOrders = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
          const totalReturns = allReturns.reduce((sum, r) => sum + r.totalAmount, 0);
          const totalPaid = customer.payments ? customer.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

          const netBalance = totalPaid - ((customer.oldBalance || 0) + totalOrders - totalReturns);

          if (netBalance >= 0) {
            customer.wallet = netBalance;
            customer.totalDebt = 0;
          } else {
            customer.wallet = 0;
            customer.totalDebt = Math.abs(netBalance);
          }

          await customer.save({ session });
        }
      });

      res.status(200).json({ success: true, message: 'Order deleted' });
    } catch (error) {
      const status = error.message === 'Order not found' ? 404 : 400;
      res.status(status).json({ success: false, message: error.message });
    } finally {
      await session.endSession();
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}