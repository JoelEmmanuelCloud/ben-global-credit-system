// api/customers/[id]/returns.js
import dbConnect from '../../../../lib/mongodb';
import Return from '../../../../models/Return';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const returns = await Return.find({ customerId: id }).sort({ createdAt: -1 });
      res.status(200).json({ success: true, returns });
    } catch (error) {
      console.error('Error fetching returns:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
