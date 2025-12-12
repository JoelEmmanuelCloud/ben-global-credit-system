// pages/api/Product/[id]/index.js
import dbConnect from '../../../../lib/mongodb';
import Product from '../../../../models/Product';
import Order from '../../../../models/Order';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      res.status(200).json({ success: true, product });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name, unit, unitPrice, lowStockThreshold, description, category, isActive } = req.body;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      // Check if name is being changed and if it already exists
      if (name && name !== product.name) {
        const existingProduct = await Product.findOne({ 
          name: { $regex: new RegExp(`^${name}$`, 'i') },
          _id: { $ne: id }
        });

        if (existingProduct) {
          return res.status(400).json({ 
            success: false, 
            message: 'Product with this name already exists' 
          });
        }
      }

      // Update fields
      if (name) product.name = name;
      if (unit) product.unit = unit;
      if (unitPrice !== undefined) product.unitPrice = unitPrice;
      if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;
      if (description !== undefined) product.description = description;
      if (category !== undefined) product.category = category;
      if (isActive !== undefined) product.isActive = isActive;

      await product.save();

      res.status(200).json({ success: true, product });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Check if product is used in any orders
      const ordersWithProduct = await Order.findOne({
        'products.name': { $regex: new RegExp('^' + id + '$', 'i') }
      });

      if (ordersWithProduct) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot delete product that has been used in orders. Consider marking it as inactive instead.' 
        });
      }

      const product = await Product.findByIdAndDelete(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}