//models/Return.js
import mongoose from 'mongoose';

const ReturnProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
});

const ReturnSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  returnNumber: {
    type: String,
    required: true,
    unique: true,
  },
  products: [ReturnProductSchema],
  totalAmount: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Return || mongoose.model('Return', ReturnSchema);
