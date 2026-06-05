// ================================================================
// LAB REPORT MODEL — MySQL/Sequelize (replaces Mongoose)
// ================================================================

/* ── COMMENTED OUT: Mongoose LabReport Schema ────────────────────
... (see git history)
─────────────────────────────────────────────── END MONGOOSE */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const LabReport = sequelize.define('LabReport', {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  reportId:       { type: DataTypes.STRING(50), allowNull: false, unique: true },
  patientId:      { type: DataTypes.INTEGER, allowNull: false },
  medicalRecordId:{ type: DataTypes.INTEGER, allowNull: true  },
  requestedBy:    { type: DataTypes.INTEGER, allowNull: false },
  uploadedBy:     { type: DataTypes.INTEGER, allowNull: true  },
  testName:       { type: DataTypes.STRING(255), allowNull: false },
  testCategory:   { type: DataTypes.STRING(100), allowNull: true },
  status: {
    type: DataTypes.ENUM('pending','completed','cancelled'),
    defaultValue: 'pending',
  },
  requestedDate:  { type: DataTypes.DATE,    defaultValue: DataTypes.NOW },
  completedDate:  { type: DataTypes.DATE,    allowNull: true },
  // Results array stored as JSON
  results:        { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  reportFileUrl:  { type: DataTypes.TEXT,    allowNull: true },
  notes:          { type: DataTypes.TEXT,    allowNull: true },
}, { tableName: 'lab_reports', timestamps: true });

module.exports = LabReport;
