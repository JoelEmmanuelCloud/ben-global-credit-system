import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
  },
});

const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  address: {
    type: String,
  },
  oldBalance: {
    type: Number,
    default: 0,
  },
  totalDebt: {
    type: Number,
    default: 0,
  },
  payments: [PaymentSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);