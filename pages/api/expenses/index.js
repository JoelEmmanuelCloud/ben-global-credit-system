import dbConnect from '../../../lib/mongodb';
import Expense from '../../../models/Expense';

export default async function handler(req, res) {
  const { method } = req;
  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const { startDate, endDate, category, search } = req.query;
        let query = {};

        // Date range filter
        if (startDate || endDate) {
          query.date = {};
          if (startDate) query.date.$gte = new Date(startDate);
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            query.date.$lte = end;
          }
        }

        // Category filter
        if (category && category !== 'all') {
          query.category = category;
        }

        // Search filter
        if (search) {
          query.$or = [
            { description: { $regex: search, $options: 'i' } },
            { vendorName: { $regex: search, $options: 'i' } },
            { receiptNumber: { $regex: search, $options: 'i' } },
          ];
        }

        const expenses = await Expense.find(query).sort({ date: -1 });

        // Calculate totals
        const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const totalVat = expenses.reduce((sum, exp) => sum + (exp.vatAmount || 0), 0);

        res.status(200).json({
          success: true,
          expenses,
          summary: {
            totalAmount,
            totalVat,
            count: expenses.length,
          }
        });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    case 'POST':
      try {
        const expense = await Expense.create(req.body);
        res.status(201).json({ success: true, expense });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}
