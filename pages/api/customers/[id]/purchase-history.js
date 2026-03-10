import dbConnect from '../../../../lib/mongodb';
import Order from '../../../../models/Order';
import Return from '../../../../models/Return';

export default async function handler(req, res) {
  const { id } = req.query;
  const { productName } = req.query;

  await dbConnect();

  if (req.method === 'GET') {
    try {
      if (!productName) {
        return res.status(400).json({
          success: false,
          message: 'Product name is required'
        });
      }

      // Find all orders for this customer containing the product
      const orders = await Order.find({
        customerId: id,
        'products.name': { $regex: new RegExp(`^${productName}$`, 'i') }
      }).select('orderNumber createdAt products').sort({ createdAt: -1 });

      // Find all returns for this customer containing the product
      const returns = await Return.find({
        customerId: id,
        'products.name': { $regex: new RegExp(`^${productName}$`, 'i') }
      }).select('returnNumber createdAt products').sort({ createdAt: -1 });

      // Calculate totals
      let totalPurchased = 0;
      let totalReturned = 0;

      const purchaseHistory = orders.map(order => {
        const product = order.products.find(
          p => p.name.toLowerCase() === productName.toLowerCase()
        );

        if (product) {
          totalPurchased += product.quantity;

          return {
            orderId: order._id,
            orderNumber: order.orderNumber,
            orderDate: order.createdAt,
            quantity: product.quantity,
            unitPrice: product.unitPrice,
          };
        }
        return null;
      }).filter(Boolean);

      returns.forEach(returnDoc => {
        const product = returnDoc.products.find(
          p => p.name.toLowerCase() === productName.toLowerCase()
        );
        if (product) {
          totalReturned += product.quantity;
        }
      });

      const availableToReturn = totalPurchased - totalReturned;

      res.status(200).json({
        success: true,
        purchaseHistory: purchaseHistory,
        totalPurchased,
        totalReturned,
        availableToReturn
      });
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } else {
    res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }
}
