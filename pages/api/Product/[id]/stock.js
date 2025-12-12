// pages/api/Product/[id]/stock.js
import dbConnect from '../../../../lib/mongodb';
import Product from '../../../../models/Product';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'POST') {
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

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const previousStock = product.currentStock;
      let newStock = previousStock;

      if (type === 'addition') {
        newStock = previousStock + quantity;
      } else if (type === 'deduction') {
        if (quantity > previousStock) {
          return res.status(400).json({ 
            success: false, 
            message: `Cannot deduct ${quantity}. Only ${previousStock} in stock.` 
          });
        }
        newStock = previousStock - quantity;
      } else if (type === 'adjustment') {
        newStock = quantity; // Direct set
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid type. Must be: addition, deduction, or adjustment' 
        });
      }

      // Add to stock history
      product.stockHistory.push({
        type,
        quantity: type === 'adjustment' ? Math.abs(quantity - previousStock) : quantity,
        previousStock,
        newStock,
        reason: reason || `Stock ${type}`,
      });

      product.currentStock = newStock;
      await product.save();

      res.status(200).json({ success: true, product });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}