import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema({
  // Basic Information
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  category: {
    type: String,
    required: true,
    enum: ['operating', 'inventory', 'tax', 'labour_transport', 'other'],
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },

  // Payment Tracking
  paymentMethod: {
    type: String,
    enum: ['cash', 'bank_transfer', 'cheque', 'mobile_money', 'other'],
    required: true,
  },
  receiptNumber: {
    type: String,
    trim: true,
  },

  // Vendor Information
  vendorName: {
    type: String,
    trim: true,
  },
  vendorContact: {
    type: String,
    trim: true,
  },

  // Tax Fields
  vatAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  isTaxDeductible: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for faster queries
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ vendorName: 'text', description: 'text' });

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
