// scripts/migrate-to-customer-payments.js
// Run this script ONCE to migrate existing data to the new payment structure

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

// Define schemas inline for migration
const PaymentSchema = new mongoose.Schema({
  amount: Number,
  date: Date,
  note: String,
});

const CustomerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  address: String,
  totalDebt: { type: Number, default: 0 },
  payments: [PaymentSchema],
});

const ProductItemSchema = new mongoose.Schema({
  name: String,
  quantity: Number,
  unitPrice: Number,
  totalPrice: Number,
});

const OldPaymentSchema = new mongoose.Schema({
  amount: Number,
  date: Date,
  note: String,
});

const OrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  orderNumber: String,
  products: [ProductItemSchema],
  totalAmount: Number,
  amountPaid: Number,
  balance: Number,
  payments: [OldPaymentSchema],
  status: String,
  createdAt: Date,
});

async function migrateData() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const Customer = mongoose.model('Customer', CustomerSchema);
    const Order = mongoose.model('Order', OrderSchema);

    const customers = await Customer.find({});
    console.log(`Found ${customers.length} customers to migrate`);

    for (const customer of customers) {
      console.log(`\nMigrating customer: ${customer.name}`);
      
      // Get all orders for this customer
      const orders = await Order.find({ customerId: customer._id });
      console.log(`  Found ${orders.length} orders`);

      // Collect all payments from orders
      const allPayments = [];
      let totalFromOrders = 0;
      
      for (const order of orders) {
        totalFromOrders += order.totalAmount;
        
        if (order.payments && order.payments.length > 0) {
          // Move payments from order to customer level
          order.payments.forEach(payment => {
            allPayments.push({
              amount: payment.amount,
              date: payment.date || order.createdAt,
              note: payment.note || `Payment for Order ${order.orderNumber}`,
            });
          });
          
          console.log(`  Moved ${order.payments.length} payments from order ${order.orderNumber}`);
        }

        // Remove payment-related fields from order
        await Order.updateOne(
          { _id: order._id },
          { 
            $unset: { 
              amountPaid: "",
              balance: "",
              payments: "",
              status: ""
            }
          }
        );
      }

      // Calculate total paid
      const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
      const newTotalDebt = totalFromOrders - totalPaid;

      // Update customer with payments and recalculated debt
      await Customer.updateOne(
        { _id: customer._id },
        { 
          $set: {
            payments: allPayments,
            totalDebt: Math.max(0, newTotalDebt)
          }
        }
      );

      console.log(`  Total orders: ₦${totalFromOrders.toLocaleString()}`);
      console.log(`  Total paid: ₦${totalPaid.toLocaleString()}`);
      console.log(`  New debt: ₦${newTotalDebt.toLocaleString()}`);
      console.log(`  Added ${allPayments.length} payments to customer record`);
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`- Migrated ${customers.length} customers`);
    console.log('- Moved all order-level payments to customer level');
    console.log('- Recalculated all customer debts');
    console.log('- Cleaned up old payment fields from orders');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run migration
migrateData();