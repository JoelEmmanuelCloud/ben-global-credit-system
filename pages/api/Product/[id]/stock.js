import mongoose from 'mongoose';
import dbConnect from '../../../../lib/mongodb';
import Product from '../../../../models/Product';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'POST') {
    const session = await mongoose.startSession();
    try {
      const { type, quantity, reason } = req.body;

      if (!type || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'Type and quantity are required'
        });
      }

      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be greater than 0'
        });
      }

      if (!['addition', 'deduction', 'adjustment'].includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Must be: addition, deduction, or adjustment'
        });
      }

      let updatedProduct;

      await session.withTransaction(async () => {
        const product = await Product.findById(id).session(session);
        if (!product) {
          throw new Error('Product not found');
        }

        const previousStock = product.currentStock;
        let newStock = previousStock;

        if (type === 'addition') {
          newStock = previousStock + quantity;
        } else if (type === 'deduction') {
          if (quantity > previousStock) {
            throw new Error(`Cannot deduct ${quantity}. Only ${previousStock} in stock.`);
          }
          newStock = previousStock - quantity;
        } else {
          newStock = quantity;
        }

        product.stockHistory.push({
          type,
          quantity: type === 'adjustment' ? Math.abs(quantity - previousStock) : quantity,
          previousStock,
          newStock,
          reason: reason || `Stock ${type}`,
        });

        product.currentStock = newStock;
        await product.save({ session });

        updatedProduct = product;
      });

      res.status(200).json({ success: true, product: updatedProduct });
    } catch (error) {
      const status = error.message === 'Product not found' ? 404 : 400;
      res.status(status).json({ success: false, message: error.message });
    } finally {
      await session.endSession();
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}