// ================================================================
// VITALS MODEL — MySQL/Sequelize (replaces Mongoose)
// ================================================================

/* ── COMMENTED OUT: Mongoose Vitals Schema ───────────────────────
... (see git history)
─────────────────────────────────────────────── END MONGOOSE */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Vitals = sequelize.define('Vitals', {
  id:            { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  patientId:     { type: DataTypes.INTEGER, allowNull: false }, // FK → patients.id
  nurseId:       { type: DataTypes.INTEGER, allowNull: false }, // FK → users.id
  appointmentId: { type: DataTypes.INTEGER, allowNull: true  },
  // Nested objects stored as JSON (preserves { value, unit } structure)
  // get() ensures MySQL string responses are always auto-parsed to objects
  temperature: {
    type: DataTypes.JSON, allowNull: true, defaultValue: null,
    get() { const v = this.getDataValue('temperature'); return typeof v === 'string' ? JSON.parse(v) : v; },
  },
  bloodPressure: {
    type: DataTypes.JSON, allowNull: true, defaultValue: null,
    get() { const v = this.getDataValue('bloodPressure'); return typeof v === 'string' ? JSON.parse(v) : v; },
  },
  pulse:           { type: DataTypes.INTEGER, allowNull: true },
  respiratoryRate: { type: DataTypes.INTEGER, allowNull: true },
  oxygenSaturation:{ type: DataTypes.DECIMAL(5,2), allowNull: true },
  weight: {
    type: DataTypes.JSON, allowNull: true, defaultValue: null,
    get() { const v = this.getDataValue('weight'); return typeof v === 'string' ? JSON.parse(v) : v; },
  },
  height: {
    type: DataTypes.JSON, allowNull: true, defaultValue: null,
    get() { const v = this.getDataValue('height'); return typeof v === 'string' ? JSON.parse(v) : v; },
  },
  bmi:             { type: DataTypes.DECIMAL(5,2), allowNull: true },
  notes:           { type: DataTypes.STRING(1000), allowNull: true },
  recordedAt:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'vitals', timestamps: true });

// Auto-calculate BMI before save
Vitals.beforeSave((record) => {
  const w = record.weight?.value;
  const h = record.height?.value;
  if (w && h) {
    const hM = h / 100;
    record.bmi = parseFloat((w / (hM * hM)).toFixed(1));
  }
});

module.exports = Vitals;
