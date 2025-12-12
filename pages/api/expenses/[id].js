import dbConnect from '../../../lib/mongodb';
import Expense from '../../../models/Expense';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const expense = await Expense.findById(id);
        if (!expense) {
          return res.status(404).json({ success: false, message: 'Expense not found' });
        }
        res.status(200).json({ success: true, expense });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    case 'PUT':
      try {
        const expense = await Expense.findByIdAndUpdate(id, req.body, {
          new: true,
          runValidators: true,
        });

        if (!expense) {
          return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        res.status(200).json({ success: true, expense });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    case 'DELETE':
      try {
        const deletedExpense = await Expense.deleteOne({ _id: id });

        if (!deletedExpense.deletedCount) {
          return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        res.status(200).json({ success: true, data: {} });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}
