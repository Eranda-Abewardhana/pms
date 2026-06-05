// ================================================================
// APPOINTMENT MODEL — MySQL/Sequelize
// Previously: Mongoose Schema
// ================================================================

/* ── COMMENTED OUT: Mongoose Appointment Schema ──────────────────
const mongoose = require('mongoose');
const { Schema } = mongoose;

const appointmentSchema = new Schema(
  {
    appointmentId: { type: String, unique: true, required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    type: { type: String, enum: ['OPD', 'Channelized'], default: 'OPD' },
    status: {
      type: String,
      enum: ['booked','confirmed','arrived','in-consultation','completed','cancelled','no-show'],
      default: 'booked',
    },
    reason: String,
    bookedBy: { type: String, enum: ['patient', 'receptionist', 'admin'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'partially_paid'], default: 'pending' },
    queueNumber: Number,
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
─────────────────────────────────────────────── END MONGOOSE */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Appointment = sequelize.define('Appointment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  appointmentId: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  // FK to patients.id
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // FK to users.id (doctor)
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  timeSlot: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('OPD', 'Channelized'),
    defaultValue: 'OPD',
  },
  status: {
    type: DataTypes.ENUM('booked', 'confirmed', 'arrived', 'in-consultation', 'completed', 'cancelled', 'no-show'),
    defaultValue: 'booked',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  bookedBy: {
    type: DataTypes.ENUM('patient', 'receptionist', 'admin'),
    allowNull: false,
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'partially_paid'),
    defaultValue: 'pending',
  },
  queueNumber: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'appointments',
  timestamps: true,
});

module.exports = Appointment;
