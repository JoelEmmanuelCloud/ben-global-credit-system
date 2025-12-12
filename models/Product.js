//models/Product.js
import mongoose from 'mongoose';

const StockHistorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['addition', 'deduction', 'adjustment'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  previousStock: {
    type: Number,
    required: true,
  },
  newStock: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  unit: {
    type: String,
    required: true,
    enum: ['bags', 'cartons', 'pieces', 'kg', 'liters', 'units'],
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  unitPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
  description: {
    type: String,
  },
  category: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  stockHistory: [StockHistorySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for faster search
ProductSchema.index({ name: 'text' });

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);