// pages/api/Product/index.js
import dbConnect from '../../../lib/mongodb';
import Product from '../../../models/Product';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const { search, active } = req.query;
      
      let query = {};
      
      // Filter by active status
      if (active !== undefined) {
        query.isActive = active === 'true';
      }
      
      // Search by name
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
        ];
      }
      
      const products = await Product.find(query).sort({ name: 1 });
      
      res.status(200).json({ success: true, products });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { name, unit, currentStock, unitPrice, lowStockThreshold, description, category } = req.body;

      // Check if product already exists
      const existingProduct = await Product.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') } 
      });

      if (existingProduct) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product with this name already exists' 
        });
      }

      const product = await Product.create({
        name,
        unit,
        currentStock: currentStock || 0,
        unitPrice,
        lowStockThreshold: lowStockThreshold || 10,
        description,
        category,
        stockHistory: currentStock > 0 ? [{
          type: 'addition',
          quantity: currentStock,
          previousStock: 0,
          newStock: currentStock,
          reason: 'Initial stock',
        }] : [],
      });

      res.status(201).json({ success: true, product });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}