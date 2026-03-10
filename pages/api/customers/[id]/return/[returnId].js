import dbConnect from '../../../../../lib/mongodb';
import Customer from '../../../../../models/Customer';
import Return from '../../../../../models/Return';
import Order from '../../../../../models/Order';
import Product from '../../../../../models/Product';

export default async function handler(req, res) {
  const { id, returnId } = req.query;
  await dbConnect();

  if (req.method === 'DELETE') {
    try {
      const returnDoc = await Return.findById(returnId);
      if (!returnDoc) {
        return res.status(404).json({ success: false, message: 'Return not found' });
      }

      for (const product of returnDoc.products) {
        if (product.productId) {
          try {
            const inventoryProduct = await Product.findById(product.productId);
            if (inventoryProduct) {
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
              await inventoryProduct.save();
            }
          } catch (error) {
            console.error(`Error reversing stock for deleted return:`, error);
          }
        }
      }

      await Return.findByIdAndDelete(returnId);

      const customer = await Customer.findById(id);
      if (customer) {
        const allOrders = await Order.find({ customerId: id });
        const allReturns = await Return.find({ customerId: id });
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

        await customer.save();
      }

      res.status(200).json({ success: true, message: 'Return deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { products, reason } = req.body;

      if (!products || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one product is required'
        });
      }

      const returnDoc = await Return.findById(returnId);
      if (!returnDoc) {
        return res.status(404).json({ success: false, message: 'Return not found' });
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

      const reversalsDone = [];
      const additionsDone = [];
      const inventoryFailures = [];

      for (const oldProduct of oldProducts) {
        if (oldProduct.productId) {
          try {
            const inventoryProduct = await Product.findById(oldProduct.productId);
            if (inventoryProduct) {
              const previousStock = inventoryProduct.currentStock;
              const newStock = Math.max(0, previousStock - oldProduct.quantity);

              inventoryProduct.stockHistory.push({
                type: 'deduction',
                quantity: oldProduct.quantity,
                previousStock,
                newStock,
                reason: `Return ${returnDoc.returnNumber} edited (reversal)`,
                returnId: returnDoc._id,
              });

              inventoryProduct.currentStock = newStock;
              await inventoryProduct.save();

              reversalsDone.push({ productId: oldProduct.productId, quantity: oldProduct.quantity });
            }
          } catch (error) {
            inventoryFailures.push(`Failed to reverse stock for "${oldProduct.name}": ${error.message}`);
            console.error(`Error reversing stock for product ${oldProduct.productId}:`, error);
          }
        }
      }

      if (inventoryFailures.length > 0) {
        for (const rev of reversalsDone) {
          try {
            const inventoryProduct = await Product.findById(rev.productId);
            if (inventoryProduct) {
              inventoryProduct.currentStock += rev.quantity;
              inventoryProduct.stockHistory.push({
                type: 'addition',
                quantity: rev.quantity,
                previousStock: inventoryProduct.currentStock - rev.quantity,
                newStock: inventoryProduct.currentStock,
                reason: `Return ${returnDoc.returnNumber} edit rollback`,
                returnId: returnDoc._id,
              });
              await inventoryProduct.save();
            }
          } catch (e) {
            console.error(`Error rolling back reversal:`, e);
          }
        }
        return res.status(400).json({
          success: false,
          message: `Inventory update failed. Return was not modified. Issues: ${inventoryFailures.join('; ')}`
        });
      }

      for (const newProduct of processedProducts) {
        if (newProduct.productId) {
          try {
            const inventoryProduct = await Product.findById(newProduct.productId);
            if (inventoryProduct) {
              const previousStock = inventoryProduct.currentStock;
              const newStock = previousStock + newProduct.quantity;

              inventoryProduct.stockHistory.push({
                type: 'addition',
                quantity: newProduct.quantity,
                previousStock,
                newStock,
                reason: `Return ${returnDoc.returnNumber} edited (new value)`,
                returnId: returnDoc._id,
              });

              inventoryProduct.currentStock = newStock;
              await inventoryProduct.save();

              additionsDone.push({ productId: newProduct.productId, quantity: newProduct.quantity });
            }
          } catch (error) {
            inventoryFailures.push(`Failed to add stock for "${newProduct.name}": ${error.message}`);
            console.error(`Error adding stock for product ${newProduct.productId}:`, error);
          }
        }
      }

      if (inventoryFailures.length > 0) {
        for (const add of additionsDone) {
          try {
            const inventoryProduct = await Product.findById(add.productId);
            if (inventoryProduct) {
              inventoryProduct.currentStock = Math.max(0, inventoryProduct.currentStock - add.quantity);
              inventoryProduct.stockHistory.push({
                type: 'deduction',
                quantity: add.quantity,
                previousStock: inventoryProduct.currentStock + add.quantity,
                newStock: inventoryProduct.currentStock,
                reason: `Return ${returnDoc.returnNumber} edit rollback`,
                returnId: returnDoc._id,
              });
              await inventoryProduct.save();
            }
          } catch (e) {
            console.error(`Error rolling back addition:`, e);
          }
        }
        for (const rev of reversalsDone) {
          try {
            const inventoryProduct = await Product.findById(rev.productId);
            if (inventoryProduct) {
              inventoryProduct.currentStock += rev.quantity;
              inventoryProduct.stockHistory.push({
                type: 'addition',
                quantity: rev.quantity,
                previousStock: inventoryProduct.currentStock - rev.quantity,
                newStock: inventoryProduct.currentStock,
                reason: `Return ${returnDoc.returnNumber} edit rollback`,
                returnId: returnDoc._id,
              });
              await inventoryProduct.save();
            }
          } catch (e) {
            console.error(`Error rolling back reversal:`, e);
          }
        }
        return res.status(400).json({
          success: false,
          message: `Inventory update failed. Return was not modified. Issues: ${inventoryFailures.join('; ')}`
        });
      }

      returnDoc.products = processedProducts;
      returnDoc.totalAmount = totalAmount;
      returnDoc.reason = reason || '';
      await returnDoc.save();

      const customer = await Customer.findById(id);
      if (customer) {
        const allOrders = await Order.find({ customerId: id });
        const allReturns = await Return.find({ customerId: id });
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

        await customer.save();
      }

      const populatedReturn = await Return.findById(returnDoc._id).populate('customerId');
      res.status(200).json({ success: true, return: populatedReturn });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
