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
