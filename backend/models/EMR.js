// ================================================================
// EMR (Medical Record) MODEL — MySQL/Sequelize
// Previously: Mongoose Schema
// ================================================================

/* ── COMMENTED OUT: Mongoose EMR Schema ─────────────────────────
const mongoose = require('mongoose');
const { Schema } = mongoose;

const medicalRecordSchema = new Schema(
  {
    recordId: { type: String, unique: true, required: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment', required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    visitDate: { type: Date, required: true },
    visitType: String,
    chiefComplaint: String,
    diagnosis: String,
    symptoms: [String],
    vitals: {
      bloodPressure: String, pulse: Number, temperature: Number,
      weight: Number, height: Number, bmi: Number, oxygenSaturation: Number,
      recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    prescriptions: [{ medicine: String, dosage: String, frequency: String, duration: String, instructions: String }],
    labTestsRequested: [{ type: Schema.Types.ObjectId, ref: 'LabTest' }],
    doctorNotes: String,
    followUpDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
─────────────────────────────────────────────── END MONGOOSE */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const EMR = sequelize.define('EMR', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  recordId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
  },
  // FK to patients.id
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // FK to appointments.id
  appointmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // FK to users.id (doctor)
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  visitDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  visitType: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  chiefComplaint: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  icdCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  // Arrays stored as JSON
  symptoms: {
    type: DataTypes.JSON, allowNull: true, defaultValue: [],
    get() { const v = this.getDataValue('symptoms'); return typeof v === 'string' ? JSON.parse(v) : (v ?? []); },
  },
  // Nested vitals object stored as JSON
  vitals: {
    type: DataTypes.JSON, allowNull: true, defaultValue: null,
    get() { const v = this.getDataValue('vitals'); return typeof v === 'string' ? JSON.parse(v) : v; },
  },
  // Prescriptions array stored as JSON
  prescriptions: {
    type: DataTypes.JSON, allowNull: true, defaultValue: [],
    get() { const v = this.getDataValue('prescriptions'); return typeof v === 'string' ? JSON.parse(v) : (v ?? []); },
  },
  // Lab test IDs stored as JSON array of integers
  labTestsRequested: {
    type: DataTypes.JSON, allowNull: true, defaultValue: [],
    get() { const v = this.getDataValue('labTestsRequested'); return typeof v === 'string' ? JSON.parse(v) : (v ?? []); },
  },
  treatmentNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  doctorNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  followUpDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  followUpNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isFinalized: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'emr',
  timestamps: true,
});

module.exports = EMR;
