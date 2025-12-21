// pages/api/orders/index.js
import dbConnect from '../../../lib/mongodb';
import Order from '../../../models/Order';
import Customer from '../../../models/Customer';
import Product from '../../../models/Product';

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

      // Filter out orders with deleted customers
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
    try {
      const { customerId, products } = req.body;

      if (!customerId || !products || products.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Customer and products are required' 
        });
      }

      // Validate and check stock for each product
      const processedProducts = [];
      const stockUpdates = [];

      for (const item of products) {
        // Try to find product in inventory
        const inventoryProduct = await Product.findOne({ 
          name: { $regex: new RegExp(`^${item.name}$`, 'i') },
          isActive: true 
        });

        if (inventoryProduct) {
          // Check if enough stock is available
          if (inventoryProduct.currentStock < item.quantity) {
            return res.status(400).json({ 
              success: false, 
              message: `Insufficient stock for ${item.name}. Available: ${inventoryProduct.currentStock} ${inventoryProduct.unit}, Requested: ${item.quantity} ${inventoryProduct.unit}` 
            });
          }

          // Use inventory price if unitPrice not provided
          const unitPrice = item.unitPrice || inventoryProduct.unitPrice;

          processedProducts.push({
            name: item.name,
            quantity: item.quantity,
            unitPrice: unitPrice,
            totalPrice: item.quantity * unitPrice,
          });

          // Prepare stock update
          stockUpdates.push({
            product: inventoryProduct,
            quantity: item.quantity,
          });
        } else {
          // Product not in inventory - allow manual entry
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

      // Generate unique order number
      let orderNumber;
      let isUnique = false;
      let attemptCount = 0;

      while (!isUnique && attemptCount < 10) {
        // Get the latest order to find the highest order number
        const latestOrder = await Order.findOne().sort({ createdAt: -1 }).select('orderNumber');

        if (latestOrder && latestOrder.orderNumber) {
          // Extract number from format "ORD-00275"
          const lastNumber = parseInt(latestOrder.orderNumber.split('-')[1]);
          orderNumber = `ORD-${String(lastNumber + 1).padStart(5, '0')}`;
        } else {
          // First order
          orderNumber = 'ORD-00001';
        }

        // Check if this order number already exists
        const existingOrder = await Order.findOne({ orderNumber });
        if (!existingOrder) {
          isUnique = true;
        }
        attemptCount++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique order number');
      }

      // Create order
      const order = await Order.create({
        customerId,
        orderNumber,
        products: processedProducts,
        totalAmount,
      });

      // Update inventory stock
      for (const update of stockUpdates) {
        const previousStock = update.product.currentStock;
        const newStock = previousStock - update.quantity;

        update.product.stockHistory.push({
          type: 'deduction',
          quantity: update.quantity,
          previousStock,
          newStock,
          reason: `Order ${orderNumber}`,
          orderId: order._id,
        });

        update.product.currentStock = newStock;
        await update.product.save();
      }

      // Update customer debt and wallet
      const customer = await Customer.findById(customerId);
      const allOrders = await Order.find({ customerId });
      const totalOrders = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalPaid = customer.payments ? customer.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;

      // Calculate net balance: if positive, it's prepaid (wallet); if negative, it's debt
      const netBalance = totalPaid - ((customer.oldBalance || 0) + totalOrders);

      if (netBalance >= 0) {
        customer.wallet = netBalance;
        customer.totalDebt = 0;
      } else {
        customer.wallet = 0;
        customer.totalDebt = Math.abs(netBalance);
      }

      await customer.save();

      const populatedOrder = await Order.findById(order._id).populate('customerId');
      res.status(201).json({ success: true, order: populatedOrder });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}