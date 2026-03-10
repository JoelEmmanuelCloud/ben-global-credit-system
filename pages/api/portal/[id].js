import dbConnect from '../../../lib/mongodb';
import Customer from '../../../models/Customer';
import Order from '../../../models/Order';
import Return from '../../../models/Return';
import jwt from 'jsonwebtoken';

const PORTAL_SECRET = process.env.JWT_SECRET + '_portal';

function verifyPortalToken(req, customerId) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  if (!token) return false;

  try {
    const payload = jwt.verify(token, PORTAL_SECRET);
    return payload.customerId === customerId;
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!verifyPortalToken(req, id)) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    await dbConnect();

    const customer = await Customer.findById(id).select(
      'name phone email address oldBalance totalDebt wallet payments createdAt'
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const orders = await Order.find({ customerId: id }).sort({ createdAt: -1 });
    const returns = await Return.find({ customerId: id }).sort({ createdAt: -1 });

    const totalOrders = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalReturns = returns.reduce((s, r) => s + r.totalAmount, 0);
    const totalPaid = customer.payments
      ? customer.payments.reduce((s, p) => s + p.amount, 0)
      : 0;

    const netBalance = totalPaid - ((customer.oldBalance || 0) + totalOrders - totalReturns);
    const totalDebt = netBalance >= 0 ? 0 : Math.abs(netBalance);
    const wallet = netBalance >= 0 ? netBalance : 0;

    return res.status(200).json({
      success: true,
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        oldBalance: customer.oldBalance || 0,
        totalDebt,
        wallet,
        payments: customer.payments || [],
        memberSince: customer.createdAt,
      },
      orders,
      returns,
    });
  } catch (error) {
    console.error('Portal customer fetch error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
