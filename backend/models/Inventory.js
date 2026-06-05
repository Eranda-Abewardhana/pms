// ================================================================
// INVENTORY MODEL — MySQL/Sequelize (replaces Mongoose)
// ================================================================

/* ── COMMENTED OUT: Mongoose Inventory Schema ────────────────────
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
─────────────────────────────────────────────── END MONGOOSE */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  itemId: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: true },
  type: { type: DataTypes.STRING, allowNull: true },
  manufacturer: { type: DataTypes.STRING, allowNull: true },
  batchNumber: { type: DataTypes.STRING, allowNull: true },
  expiryDate: { type: DataTypes.DATE, allowNull: true },
  stockQuantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  reorderLevel: { type: DataTypes.INTEGER, defaultValue: 10 },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  unit: { type: DataTypes.STRING, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  addedBy: { type: DataTypes.INTEGER, allowNull: true },
}, { 
  tableName: 'inventory', 
  timestamps: true 
});

module.exports = Inventory;
