//pages/api/customers/index.js
import dbConnect from '../../../lib/mongodb';
import Customer from '../../../models/Customer';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const customers = await Customer.find({}).sort({ createdAt: -1 });
      res.status(200).json({ success: true, customers });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const customer = await Customer.create(req.body);
      res.status(201).json({ success: true, customer });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}