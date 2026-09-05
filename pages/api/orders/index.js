import mongoose from 'mongoose';
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Customer from '../../../models/Customer';
import Product from '../../../models/Product';
import Return from '../../../models/Return';
import { escapeRegex } from '../../../lib/regexEscape';

export default async function handler(req, res) {
  try {
    await dbConnect();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error.message
    });
  }

  if (req.method === 'GET') {
    try {
      console.log('Fetching orders...');
      const orders = await Order.find()
        .populate({
          path: 'customerId',
          select: 'name phone email totalDebt wallet'
        })
        .sort({ createdAt: -1 });

      console.log(`Found ${orders.length} orders`);

      const validOrders = orders.filter(order => order.customerId != null);

      console.log(`Returning ${validOrders.length} valid orders`);

      res.status(200).json({ success: true, orders: validOrders });
    } catch (error) {
      console.error('Error fetching orders:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  } else if (req.method === 'POST') {
    const session = await mongoose.startSession();
    try {
      const { customerId, products } = req.body;

      if (!customerId || !products || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Customer and products are required'
        });
      }

      let createdOrderId;

      await session.withTransaction(async () => {
        const processedProducts = [];
        const stockUpdates = [];

        for (const item of products) {
          const inventoryProduct = await Product.findOne({
            name: { $regex: new RegExp(`^${escapeRegex(item.name)}$`, 'i') },
            isActive: true
          }).session(session);

          if (inventoryProduct) {
            if (inventoryProduct.currentStock < item.quantity) {
              throw new Error(`Insufficient stock for ${item.name}. Available: ${inventoryProduct.currentStock} ${inventoryProduct.unit}, Requested: ${item.quantity} ${inventoryProduct.unit}`);
            }

            const unitPrice = item.unitPrice || inventoryProduct.unitPrice;

            processedProducts.push({
              name: item.name,
              quantity: item.quantity,
              unitPrice: unitPrice,
              totalPrice: item.quantity * unitPrice,
            });

            stockUpdates.push({
              productId: inventoryProduct._id,
              quantity: item.quantity,
            });
          } else {
            processedProducts.push({
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
            });
          }
        }

        const totalAmount = processedProducts.reduce(
          (sum, product) => sum + product.totalPrice,
          0
        );

        let orderNumber;
        let isUnique = false;
        let attemptCount = 0;

        while (!isUnique && attemptCount < 10) {
          const latestOrder = await Order.findOne().sort({ createdAt: -1 }).select('orderNumber').session(session);

          if (latestOrder && latestOrder.orderNumber) {
            const lastNumber = parseInt(latestOrder.orderNumber.split('-')[1]);
            orderNumber = `ORD-${String(lastNumber + 1).padStart(5, '0')}`;
          } else {
            orderNumber = 'ORD-00001';
          }

          const existingOrder = await Order.findOne({ orderNumber }).session(session);
          if (!existingOrder) {
            isUnique = true;
          }
          attemptCount++;
        }

        if (!isUnique) {
          throw new Error('Failed to generate unique order number');
        }

        const customer = await Customer.findById(customerId).session(session);
        if (!customer) {
          throw new Error('Customer not found');
        }
        const walletBeforeOrder = customer.wallet || 0;

        const [order] = await Order.create([{
          customerId,
          orderNumber,
          products: processedProducts,
          totalAmount,
          walletUsed: 0,
        }], { session });

        for (const update of stockUpdates) {
          const inventoryProduct = await Product.findById(update.productId).session(session);
          const previousStock = inventoryProduct.currentStock;
          const newStock = previousStock - update.quantity;

          if (newStock < 0) {
            throw new Error(`Insufficient stock for ${inventoryProduct.name}. Available: ${previousStock} ${inventoryProduct.unit}, Requested: ${update.quantity} ${inventoryProduct.unit}`);
          }

          inventoryProduct.stockHistory.push({
            type: 'deduction',
            quantity: update.quantity,
            previousStock,
            newStock,
            reason: `Order ${orderNumber}`,
            orderId: order._id,
          });

          inventoryProduct.currentStock = newStock;
          await inventoryProduct.save({ session });
        }

        const allOrders = await Order.find({ customerId }).session(session);
        const allReturns = await Return.find({ customerId }).session(session);
        const totalOrders = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);
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

        const walletAfterOrder = customer.wallet || 0;
        const walletUsedForOrder = Math.max(0, walletBeforeOrder - walletAfterOrder);

        order.walletUsed = walletUsedForOrder;
        await order.save({ session });

        await customer.save({ session });

        createdOrderId = order._id;
      });

      const populatedOrder = await Order.findById(createdOrderId).populate('customerId');
      res.status(201).json({ success: true, order: populatedOrder });
    } catch (error) {
      console.error('Error creating order:', error);
      const status = error.message === 'Customer not found' ? 404 : 400;
      res.status(status).json({ success: false, message: error.message });
    } finally {
      await session.endSession();
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
