import mongoose from 'mongoose';
import dbConnect from '../../../../../lib/mongodb';
import Customer from '../../../../../models/Customer';
import Return from '../../../../../models/Return';
import Order from '../../../../../models/Order';
import Product from '../../../../../models/Product';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'POST') {
    const session = await mongoose.startSession();
    try {
      const { products, orderId, reason } = req.body;

      if (!products || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one product is required'
        });
      }

      let createdReturnId;

      await session.withTransaction(async () => {
        const customer = await Customer.findById(id).session(session);
        if (!customer) {
          throw new Error('Customer not found');
        }

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

        let returnNumber;
        let isUnique = false;
        let attemptCount = 0;

        while (!isUnique && attemptCount < 10) {
          const latestReturn = await Return.findOne().sort({ createdAt: -1 }).select('returnNumber').session(session);

          if (latestReturn && latestReturn.returnNumber) {
            const lastNumber = parseInt(latestReturn.returnNumber.split('-')[1]);
            returnNumber = `RET-${String(lastNumber + 1).padStart(5, '0')}`;
          } else {
            returnNumber = 'RET-00001';
          }

          const existingReturn = await Return.findOne({ returnNumber }).session(session);
          if (!existingReturn) {
            isUnique = true;
          }
          attemptCount++;
        }

        if (!isUnique) {
          throw new Error('Failed to generate unique return number');
        }

        const [returnDoc] = await Return.create([{
          customerId: id,
          orderId: orderId || null,
          returnNumber,
          products: processedProducts,
          totalAmount,
          reason: reason || '',
        }], { session });

        for (const product of processedProducts) {
          if (!product.productId) continue;

          const inventoryProduct = await Product.findById(product.productId).session(session);
          if (!inventoryProduct) {
            throw new Error(`Product "${product.name}" (ID: ${product.productId}) not found in inventory`);
          }

          const previousStock = inventoryProduct.currentStock;
          const newStock = previousStock + product.quantity;

          inventoryProduct.stockHistory.push({
            type: 'addition',
            quantity: product.quantity,
            previousStock,
            newStock,
            reason: `Return ${returnNumber}`,
            returnId: returnDoc._id,
          });

          inventoryProduct.currentStock = newStock;
          await inventoryProduct.save({ session });
        }

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

        createdReturnId = returnDoc._id;
      });

      const populatedReturn = await Return.findById(createdReturnId).populate('customerId');
      res.status(201).json({ success: true, return: populatedReturn });
    } catch (error) {
      console.error('Error creating return:', error);
      const status = error.message === 'Customer not found' ? 404 : 400;
      res.status(status).json({ success: false, message: error.message });
    } finally {
      await session.endSession();
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
