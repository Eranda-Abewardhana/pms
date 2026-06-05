const mongoose = require('mongoose');
const { Schema } = mongoose;

const inventorySchema = new Schema(
  {
    itemId: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: String,
    type: String,
    manufacturer: String,
    batchNumber: String,
    expiryDate: Date,
    stockQuantity: {
      type: Number,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      default: 10,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    unit: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Inventory', inventorySchema);
