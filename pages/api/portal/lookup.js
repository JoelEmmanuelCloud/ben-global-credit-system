import dbConnect from '../../../lib/mongodb';
import Customer from '../../../models/Customer';
import jwt from 'jsonwebtoken';

const PORTAL_SECRET = process.env.JWT_SECRET + '_portal';

const attempts = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const window = 15 * 60 * 1000;
  const max = 10;

  const record = attempts.get(ip) || { count: 0, resetAt: now + window };

  if (now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + window });
    return false;
  }

  if (record.count >= max) return true;

  record.count += 1;
  attempts.set(ip, record);
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

  if (isRateLimited(ip)) {
    return res.status(429).json({
      success: false,
      message: 'Too many attempts. Please wait 15 minutes before trying again.',
    });
  }

  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Name and phone number are required.' });
  }

  try {
    await dbConnect();

    const normalizedPhone = phone.replace(/\D/g, '');

    const customers = await Customer.find({
      name: { $regex: new RegExp(`^\\s*${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') },
    }).select('_id name phone');

    const match = customers.find(c => c.phone.replace(/\D/g, '') === normalizedPhone);

    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'No account found with that name and phone number.',
      });
    }

    const token = jwt.sign(
      { customerId: match._id.toString() },
      PORTAL_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({ success: true, token, customerId: match._id.toString() });
  } catch (error) {
    console.error('Portal lookup error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
}
