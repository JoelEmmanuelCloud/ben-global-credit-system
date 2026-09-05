import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';
import Order from '../../../../models/Order';
import Customer from '../../../../models/Customer';
import Product from '../../../../models/Product';
import Return from '../../../../models/Return';
import { escapeRegex } from '../../../../lib/regexEscape';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'PUT') {
    const session = await mongoose.startSession();
    try {
      const { products } = req.body;

      if (!products || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one product is required'
        });
      }

      await session.withTransaction(async () => {
        const order = await Order.findById(id).session(session);
        if (!order) {
          throw new Error('Order not found');
        }

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

        const quantityByName = new Map();
        for (const product of order.products) {
          quantityByName.set(product.name, (quantityByName.get(product.name) || 0) - product.quantity);
        }
        for (const product of processedProducts) {
          quantityByName.set(product.name, (quantityByName.get(product.name) || 0) + product.quantity);
        }

        for (const [name, delta] of quantityByName.entries()) {
          if (delta === 0) continue;

          const inventoryProduct = await Product.findOne({
            name: { $regex: new RegExp(`^${escapeRegex(name)}$`, 'i') }
          }).session(session);

          if (!inventoryProduct) continue;

          const previousStock = inventoryProduct.currentStock;
          const newStock = previousStock - delta;

          if (newStock < 0) {
            throw new Error(`Insufficient stock for ${name}. Available: ${previousStock} ${inventoryProduct.unit}, Additional requested: ${delta} ${inventoryProduct.unit}`);
          }

          inventoryProduct.stockHistory.push({
            type: delta > 0 ? 'deduction' : 'addition',
            quantity: Math.abs(delta),
            previousStock,
            newStock,
            reason: `Order ${order.orderNumber} edited`,
            orderId: order._id,
          });

          inventoryProduct.currentStock = newStock;
          await inventoryProduct.save({ session });
        }

        const customer = await Customer.findById(order.customerId).session(session);
        const walletBeforeEdit = customer.wallet || 0;

        order.products = processedProducts;
        order.totalAmount = newTotalAmount;
        await order.save({ session });

        const allOrders = await Order.find({ customerId: order.customerId }).session(session);
        const allReturns = await Return.find({ customerId: order.customerId }).session(session);
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

        const walletAfterEdit = customer.wallet || 0;
        const walletUsedForOrder = Math.max(0, walletBeforeEdit - walletAfterEdit);

        order.walletUsed = walletUsedForOrder;
        await order.save({ session });

        await customer.save({ session });
      });

      const populatedOrder = await Order.findById(id).populate('customerId');
      res.status(200).json({ success: true, order: populatedOrder });
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
