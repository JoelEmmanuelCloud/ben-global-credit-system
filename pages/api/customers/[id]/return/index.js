// api/customers/[id]/return/index.js
import dbConnect from '../../../../../lib/mongodb';
import Customer from '../../../../../models/Customer';
import Return from '../../../../../models/Return';
import Order from '../../../../../models/Order';
import Product from '../../../../../models/Product';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const { products, orderId, reason } = req.body;

      // Validate products
      if (!products || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one product is required'
        });
      }

      // Get customer
      const customer = await Customer.findById(id);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: 'Customer not found'
        });
      }

      // Process products
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

      // Generate unique return number
      let returnNumber;
      let isUnique = false;
      let attemptCount = 0;

      while (!isUnique && attemptCount < 10) {
        const latestReturn = await Return.findOne().sort({ createdAt: -1 }).select('returnNumber');

        if (latestReturn && latestReturn.returnNumber) {
          const lastNumber = parseInt(latestReturn.returnNumber.split('-')[1]);
          returnNumber = `RET-${String(lastNumber + 1).padStart(5, '0')}`;
        } else {
          returnNumber = 'RET-00001';
        }

        const existingReturn = await Return.findOne({ returnNumber });
        if (!existingReturn) {
          isUnique = true;
        }
        attemptCount++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique return number');
      }

      // Create return
      const returnDoc = await Return.create({
        customerId: id,
        orderId: orderId || null,
        returnNumber,
        products: processedProducts,
        totalAmount,
        reason: reason || '',
      });

      // Update inventory stock for returned products
      for (const product of processedProducts) {
        // Only update if productId is provided (inventory product)
        if (product.productId) {
          try {
            const inventoryProduct = await Product.findById(product.productId);

            if (inventoryProduct) {
              const previousStock = inventoryProduct.currentStock;
              const newStock = previousStock + product.quantity;

              // Add to stock history
              inventoryProduct.stockHistory.push({
                type: 'addition',
                quantity: product.quantity,
                previousStock,
                newStock,
                reason: `Return ${returnNumber}`,
                returnId: returnDoc._id,
              });

              inventoryProduct.currentStock = newStock;
              await inventoryProduct.save();

              console.log(`Stock updated for ${inventoryProduct.name}: ${previousStock} -> ${newStock}`);
            } else {
              console.warn(`Product with ID ${product.productId} not found in inventory`);
            }
          } catch (error) {
            console.error(`Error updating inventory for product ${product.productId}:`, error);
            // Continue processing other products even if one fails
          }
        }
      }

      // Recalculate customer debt
      const allOrders = await Order.find({ customerId: id });
      const allReturns = await Return.find({ customerId: id });
      const totalOrders = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      const totalReturns = allReturns.reduce((sum, ret) => sum + ret.totalAmount, 0);
      const totalPaid = customer.payments ? customer.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;

      // Calculate net balance: totalPaid - (oldBalance + totalOrders - totalReturns)
      const netBalance = totalPaid - ((customer.oldBalance || 0) + totalOrders - totalReturns);

      if (netBalance >= 0) {
        customer.wallet = netBalance;
        customer.totalDebt = 0;
      } else {
        customer.wallet = 0;
        customer.totalDebt = Math.abs(netBalance);
      }

      await customer.save();

      const populatedReturn = await Return.findById(returnDoc._id).populate('customerId');
      res.status(201).json({ success: true, return: populatedReturn });
    } catch (error) {
      console.error('Error creating return:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
