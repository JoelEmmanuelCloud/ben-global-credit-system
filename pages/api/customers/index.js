import dbConnect from '../../../lib/mongodb';
import Customer from '../../../models/Customer';
import Order from '../../../models/Order';
import Return from '../../../models/Return';

export default async function handler(req, res) {
  const { method } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const customers = await Customer.find({}).sort({ createdAt: -1 });

        const customersWithDebt = await Promise.all(
          customers.map(async (customer) => {
            const orders = await Order.find({ customerId: customer._id });
            const returns = await Return.find({ customerId: customer._id });
            const totalOrders = orders.reduce((sum, order) => sum + order.totalAmount, 0);
            const totalReturns = returns.reduce((sum, ret) => sum + ret.totalAmount, 0);
            const totalPaid = customer.payments ? customer.payments.reduce((sum, p) => sum + p.amount, 0) : 0;

            const netBalance = totalPaid - ((customer.oldBalance || 0) + totalOrders - totalReturns);

            let calculatedDebt;
            let calculatedWallet;
            if (netBalance >= 0) {
              calculatedWallet = netBalance;
              calculatedDebt = 0;
            } else {
              calculatedWallet = 0;
              calculatedDebt = Math.abs(netBalance);
            }

            // Update if different
            if (customer.totalDebt !== calculatedDebt || customer.wallet !== calculatedWallet) {
              await Customer.findByIdAndUpdate(customer._id, {
                totalDebt: calculatedDebt,
                wallet: calculatedWallet
              });
            }

            return {
              ...customer.toObject(),
              totalDebt: calculatedDebt,
              wallet: calculatedWallet
            };
          })
        );

        res.status(200).json({ success: true, customers: customersWithDebt });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    case 'POST':
      try {
        const { oldBalance, ...customerData } = req.body;
        
        const customer = await Customer.create({
          ...customerData,
          oldBalance: parseFloat(oldBalance) || 0,
          totalDebt: parseFloat(oldBalance) || 0,
        });
        
        res.status(201).json({ success: true, customer });
      } catch (error) {
        res.status(400).json({ success: false, message: error.message });
      }
      break;

    default:
      res.status(400).json({ success: false });
      break;
  }
}


















