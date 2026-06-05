// ================================================================
// PATIENT MODEL — MySQL/Sequelize
// Previously: Mongoose Schema
// ================================================================

/* ── COMMENTED OUT: Mongoose Patient Schema ──────────────────────
const mongoose = require('mongoose');
const { Schema } = mongoose;

const patientSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    patientId: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    email: String,
    phone: String,
    nic: { type: String, unique: true },
    dateOfBirth: Date,
    age: Number,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    bloodGroup: String,
    address: String,
    guardian: { name: String, relationship: String, phone: String },
    allergies: [String],
    chronicConditions: [String],
    isActive: { type: Boolean, default: true },
    registeredBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
─────────────────────────────────────────────── END MONGOOSE */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  // FK to users.id — set via association in db.js
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  patientId: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  nic: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other'),
    allowNull: true,
  },
  bloodGroup: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Embedded objects/arrays stored as JSON
  guardian: {
    type: DataTypes.JSON, allowNull: true, defaultValue: null,
    get() { const v = this.getDataValue('guardian'); return typeof v === 'string' ? JSON.parse(v) : v; },
  },
  allergies: {
    type: DataTypes.JSON, allowNull: true, defaultValue: [],
    get() { const v = this.getDataValue('allergies'); return typeof v === 'string' ? JSON.parse(v) : (v ?? []); },
  },
  chronicConditions: {
    type: DataTypes.JSON, allowNull: true, defaultValue: [],
    get() { const v = this.getDataValue('chronicConditions'); return typeof v === 'string' ? JSON.parse(v) : (v ?? []); },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  // FK to users.id — set via association in db.js
  registeredBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'patients',
  timestamps: true,
});

module.exports = Patient;
