// api/customers/[id]/return/[returnId].js
import dbConnect from '../../../../../../lib/mongodb';
import Customer from '../../../../../../models/Customer';
import Return from '../../../../../../models/Return';
import Order from '../../../../../../models/Order';

export default async function handler(req, res) {
  const { id, returnId } = req.query;
  await dbConnect();

  if (req.method === 'DELETE') {
    try {
      const returnDoc = await Return.findById(returnId);
      if (!returnDoc) {
        return res.status(404).json({ success: false, message: 'Return not found' });
      }

      await Return.findByIdAndDelete(returnId);

      // Recalculate customer debt
      const customer = await Customer.findById(id);
      if (customer) {
        const allOrders = await Order.find({ customerId: id });
        const allReturns = await Return.find({ customerId: id });
        const totalOrders = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalReturns = allReturns.reduce((sum, ret) => sum + ret.totalAmount, 0);
        const totalPaid = customer.payments ? customer.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;

        // Calculate net balance
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

      // Process products
      const processedProducts = products.map(product => ({
        name: product.name,
        quantity: parseFloat(product.quantity),
        unitPrice: parseFloat(product.unitPrice),
        totalPrice: parseFloat(product.quantity) * parseFloat(product.unitPrice),
      }));

      const totalAmount = processedProducts.reduce(
        (sum, product) => sum + product.totalPrice,
        0
      );

      // Update return
      returnDoc.products = processedProducts;
      returnDoc.totalAmount = totalAmount;
      returnDoc.reason = reason || '';
      await returnDoc.save();

      // Recalculate customer debt
      const customer = await Customer.findById(id);
      if (customer) {
        const allOrders = await Order.find({ customerId: id });
        const allReturns = await Return.find({ customerId: id });
        const totalOrders = allOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const totalReturns = allReturns.reduce((sum, ret) => sum + ret.totalAmount, 0);
        const totalPaid = customer.payments ? customer.payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;

        // Calculate net balance
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
