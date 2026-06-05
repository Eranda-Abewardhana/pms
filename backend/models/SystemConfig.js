// ================================================================
// SYSTEM CONFIG MODEL — MySQL/Sequelize (replaces Mongoose)
// ================================================================

/* ── COMMENTED OUT: Mongoose SystemConfig Schema ─────────────────
const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  clinicName: { type: String, default: 'Metro Medi Care' },
  contactEmail: String,
  contactPhone: String,
  address: String,
  currency: { type: String, default: 'LKR' },
  languages: { type: [String], default: ['English', 'Sinhala'] },
  notifications: {
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: false }
  },
  appointmentInterval: { type: Number, default: 30 }, // minutes
  mfaRequired: { type: Boolean, default: false },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
─────────────────────────────────────────────── END MONGOOSE */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const SystemConfig = sequelize.define('SystemConfig', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  clinicName: { type: DataTypes.STRING, defaultValue: 'Metro Medi Care' },
  contactEmail: { type: DataTypes.STRING, allowNull: true },
  contactPhone: { type: DataTypes.STRING, allowNull: true },
  address: { type: DataTypes.STRING, allowNull: true },
  currency: { type: DataTypes.STRING, defaultValue: 'LKR' },
  languages: { 
    type: DataTypes.JSON, 
    defaultValue: ['English', 'Sinhala'] 
  },
  notifications: { 
    type: DataTypes.JSON, 
    defaultValue: { emailEnabled: true, smsEnabled: false } 
  },
  appointmentInterval: { type: DataTypes.INTEGER, defaultValue: 30 },
  mfaRequired: { type: DataTypes.BOOLEAN, defaultValue: false },
  updatedBy: { type: DataTypes.INTEGER, allowNull: true }
}, { 
  tableName: 'system_config', 
  timestamps: true 
});

module.exports = SystemConfig;
