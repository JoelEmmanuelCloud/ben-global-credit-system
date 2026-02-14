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

      // Update inventory stock for returned products BEFORE creating the return record
      // This ensures inventory is updated first; if it fails, no orphaned return is created
      const inventoryUpdates = []; // Track updates for rollback if needed
      const inventoryFailures = [];

      for (const product of processedProducts) {
        if (product.productId) {
          try {
            const inventoryProduct = await Product.findById(product.productId);

            if (inventoryProduct) {
              const previousStock = inventoryProduct.currentStock;
              const newStock = previousStock + product.quantity;

              inventoryProduct.stockHistory.push({
                type: 'addition',
                quantity: product.quantity,
                previousStock,
                newStock,
                reason: `Return ${returnNumber}`,
              });

              inventoryProduct.currentStock = newStock;
              await inventoryProduct.save();

              inventoryUpdates.push({ productId: product.productId, quantity: product.quantity, productName: inventoryProduct.name });
              console.log(`Stock updated for ${inventoryProduct.name}: ${previousStock} -> ${newStock}`);
            } else {
              inventoryFailures.push(`Product "${product.name}" (ID: ${product.productId}) not found in inventory`);
              console.warn(`Product with ID ${product.productId} not found in inventory`);
            }
          } catch (error) {
            inventoryFailures.push(`Failed to update inventory for "${product.name}": ${error.message}`);
            console.error(`Error updating inventory for product ${product.productId}:`, error);
          }
        }
      }

      // If any inventory updates with a productId failed, rollback successful ones and abort
      if (inventoryFailures.length > 0) {
        // Rollback successful inventory updates
        for (const update of inventoryUpdates) {
          try {
            const inventoryProduct = await Product.findById(update.productId);
            if (inventoryProduct) {
              const previousStock = inventoryProduct.currentStock;
              const newStock = Math.max(0, previousStock - update.quantity);

              inventoryProduct.stockHistory.push({
                type: 'deduction',
                quantity: update.quantity,
                previousStock,
                newStock,
                reason: `Return ${returnNumber} rolled back due to inventory error`,
              });

              inventoryProduct.currentStock = newStock;
              await inventoryProduct.save();
            }
          } catch (rollbackError) {
            console.error(`Error rolling back inventory for product ${update.productId}:`, rollbackError);
          }
        }

        return res.status(400).json({
          success: false,
          message: `Inventory update failed. Return was not created. Issues: ${inventoryFailures.join('; ')}`
        });
      }

      // Create return only after inventory is successfully updated
      const returnDoc = await Return.create({
        customerId: id,
        orderId: orderId || null,
        returnNumber,
        products: processedProducts,
        totalAmount,
        reason: reason || '',
      });

      // Update returnId in stock history entries
      for (const update of inventoryUpdates) {
        try {
          const inventoryProduct = await Product.findById(update.productId);
          if (inventoryProduct) {
            const lastEntry = inventoryProduct.stockHistory[inventoryProduct.stockHistory.length - 1];
            if (lastEntry && lastEntry.reason === `Return ${returnNumber}`) {
              lastEntry.returnId = returnDoc._id;
              await inventoryProduct.save();
            }
          }
        } catch (error) {
          // Non-critical: returnId reference in history is nice-to-have
          console.error(`Error updating returnId in stock history:`, error);
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
