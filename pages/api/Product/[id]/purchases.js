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

      const escapedName = product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const orders = await Order.find({
        'products.name': { $regex: new RegExp(`^${escapedName}$`, 'i') }
      }).populate('customerId', 'name phone').sort({ createdAt: -1 });

      const purchases = orders.map(order => {
        const matchingProduct = order.products.find(
          p => p.name.toLowerCase() === product.name.toLowerCase()
        );
        if (!matchingProduct) return null;

        return {
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderDate: order.createdAt,
          customerName: order.customerId?.name || 'Unknown',
          customerPhone: order.customerId?.phone || '',
          customerId: order.customerId?._id,
          quantity: matchingProduct.quantity,
          unitPrice: matchingProduct.unitPrice,
          totalPrice: matchingProduct.totalPrice,
        };
      }).filter(Boolean);

      const totalQuantitySold = purchases.reduce((sum, p) => sum + p.quantity, 0);
      const totalRevenue = purchases.reduce((sum, p) => sum + p.totalPrice, 0);

      res.status(200).json({
        success: true,
        productName: product.name,
        purchases,
        totalQuantitySold,
        totalRevenue,
        totalOrders: purchases.length,
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
