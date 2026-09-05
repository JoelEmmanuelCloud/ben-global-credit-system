import mongoose from 'mongoose';
import dbConnect from '../../../../../lib/mongodb';
import Customer from '../../../../../models/Customer';
import Return from '../../../../../models/Return';
import Order from '../../../../../models/Order';
import Product from '../../../../../models/Product';

export default async function handler(req, res) {
  const { id, returnId } = req.query;
  await dbConnect();

  if (req.method === 'DELETE') {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const returnDoc = await Return.findById(returnId).session(session);
        if (!returnDoc) {
          throw new Error('Return not found');
        }

        for (const product of returnDoc.products) {
          if (!product.productId) continue;

          const inventoryProduct = await Product.findById(product.productId).session(session);
          if (!inventoryProduct) continue;

          const previousStock = inventoryProduct.currentStock;
          const newStock = Math.max(0, previousStock - product.quantity);

          inventoryProduct.stockHistory.push({
            type: 'deduction',
            quantity: product.quantity,
            previousStock,
            newStock,
            reason: `Return ${returnDoc.returnNumber} deleted`,
            returnId: returnDoc._id,
          });

          inventoryProduct.currentStock = newStock;
          await inventoryProduct.save({ session });
        }

        await Return.findByIdAndDelete(returnId).session(session);

        const customer = await Customer.findById(id).session(session);
        if (customer) {
          const allOrders = await Order.find({ customerId: id }).session(session);
          const allReturns = await Return.find({ customerId: id }).session(session);
          const totalOrders = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
          const totalReturns = allReturns.reduce((sum, ret) => sum + ret.totalAmount, 0);
          const totalPaid = customer.payments ? customer.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;

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

      res.status(200).json({ success: true, message: 'Return deleted successfully' });
    } catch (error) {
      const status = error.message === 'Return not found' ? 404 : 400;
      res.status(status).json({ success: false, message: error.message });
    } finally {
      await session.endSession();
    }
  } else if (req.method === 'PUT') {
    const session = await mongoose.startSession();
    try {
      const { products, reason } = req.body;

      if (!products || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one product is required'
        });
      }

      let updatedReturnId;

      await session.withTransaction(async () => {
        const returnDoc = await Return.findById(returnId).session(session);
        if (!returnDoc) {
          throw new Error('Return not found');
        }

        const oldProducts = returnDoc.products;

        const processedProducts = products.map(product => ({
          name: product.name,
          quantity: parseFloat(product.quantity),
          unitPrice: parseFloat(product.unitPrice),
          totalPrice: parseFloat(product.quantity) * parseFloat(product.unitPrice),
          productId: product.productId || null,
        }));

        const totalAmount = processedProducts.reduce(
          (sum, product) => sum + product.totalPrice,
          0
        );

        const quantityByProductId = new Map();
        for (const product of oldProducts) {
          if (!product.productId) continue;
          const key = product.productId.toString();
          quantityByProductId.set(key, (quantityByProductId.get(key) || 0) - product.quantity);
        }
        for (const product of processedProducts) {
          if (!product.productId) continue;
          const key = product.productId.toString();
          quantityByProductId.set(key, (quantityByProductId.get(key) || 0) + product.quantity);
        }

        for (const [productId, delta] of quantityByProductId.entries()) {
          if (delta === 0) continue;

          const inventoryProduct = await Product.findById(productId).session(session);
          if (!inventoryProduct) {
            throw new Error(`Product (ID: ${productId}) not found in inventory`);
          }

          const previousStock = inventoryProduct.currentStock;
          const newStock = Math.max(0, previousStock + delta);

          inventoryProduct.stockHistory.push({
            type: delta > 0 ? 'addition' : 'deduction',
            quantity: Math.abs(delta),
            previousStock,
            newStock,
            reason: `Return ${returnDoc.returnNumber} edited`,
            returnId: returnDoc._id,
          });

          inventoryProduct.currentStock = newStock;
          await inventoryProduct.save({ session });
        }

        returnDoc.products = processedProducts;
        returnDoc.totalAmount = totalAmount;
        returnDoc.reason = reason || '';
        await returnDoc.save({ session });

        const customer = await Customer.findById(id).session(session);
        if (customer) {
          const allOrders = await Order.find({ customerId: id }).session(session);
          const allReturns = await Return.find({ customerId: id }).session(session);
          const totalOrders = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
          const totalReturns = allReturns.reduce((sum, ret) => sum + ret.totalAmount, 0);
          const totalPaid = customer.payments ? customer.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;

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

        updatedReturnId = returnDoc._id;
      });

      const populatedReturn = await Return.findById(updatedReturnId).populate('customerId');
      res.status(200).json({ success: true, return: populatedReturn });
    } catch (error) {
      const status = error.message === 'Return not found' ? 404 : 400;
      res.status(status).json({ success: false, message: error.message });
    } finally {
      await session.endSession();
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
