// ================================================================
// PAYMENT MODEL — MySQL/Sequelize (replaces Mongoose)
// ================================================================

/* ── COMMENTED OUT: Mongoose Payment Schema ──────────────────────
const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    paymentId: {
      type: String,
      unique: true,
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    items: [
      {
        description: String,
        amount: Number,
      },
    ],
    subtotal: Number,
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalAmount: Number,
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'online', null],
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partially_paid', 'cancelled'],
      default: 'pending',
    },
    transactionId: String,
    receiptNumber: String,
    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
─────────────────────────────────────────────── END MONGOOSE */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  paymentId: { type: DataTypes.STRING, unique: true, allowNull: false },
  patientId: { type: DataTypes.INTEGER, allowNull: false },
  appointmentId: { type: DataTypes.INTEGER, allowNull: true },
  processedBy: { type: DataTypes.INTEGER, allowNull: true },
  items: { type: DataTypes.JSON, defaultValue: [] },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  tax: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  paymentMethod: { 
    type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'online'), 
    allowNull: true 
  },
  paymentStatus: { 
    type: DataTypes.ENUM('pending', 'paid', 'partially_paid', 'cancelled'), 
    defaultValue: 'pending' 
  },
  transactionId: { type: DataTypes.STRING, allowNull: true },
  receiptNumber: { type: DataTypes.STRING, allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true },
}, { 
  tableName: 'payments', 
  timestamps: true 
});

module.exports = Payment;
