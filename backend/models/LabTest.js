// ================================================================
// LAB TEST MODEL — MySQL/Sequelize (replaces Mongoose)
// ================================================================

/* ── COMMENTED OUT: Mongoose LabTest Schema ──────────────────────
... (see git history)
─────────────────────────────────────────────── END MONGOOSE */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const LAB_TEST_TYPES = [
  'Blood CBC','Blood Sugar (Fasting)','Blood Sugar (Random)','Lipid Panel',
  'Liver Function Test','Kidney Function Test','Thyroid (TSH)','Urine Full Report',
  'Urine Culture','ECG','Chest X-Ray','Ultrasound (Abdomen)','COVID-19 PCR','HbA1c','Other',
];

const LabTest = sequelize.define('LabTest', {
  id:             { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  testId:         { type: DataTypes.STRING(30), allowNull: true, unique: true },
  patientId:      { type: DataTypes.INTEGER, allowNull: false },
  requestedBy:    { type: DataTypes.INTEGER, allowNull: false }, // FK → users.id (doctor)
  assignedTo:     { type: DataTypes.INTEGER, allowNull: true  }, // FK → users.id (labtech)
  appointmentId:  { type: DataTypes.INTEGER, allowNull: true  },
  testType: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  customTestName: { type: DataTypes.STRING(255), allowNull: true },
  priority: {
    type: DataTypes.ENUM('routine','urgent','stat'),
    defaultValue: 'routine',
  },
  status: {
    type: DataTypes.ENUM('pending','in-progress','completed','cancelled'),
    defaultValue: 'pending',
  },
  clinicalNotes:  { type: DataTypes.STRING(500), allowNull: true },
  results:        { type: DataTypes.TEXT,         allowNull: true },
  resultSummary:  { type: DataTypes.STRING(500), allowNull: true },
  isAbnormal:     { type: DataTypes.BOOLEAN, defaultValue: false },
  completedAt:    { type: DataTypes.DATE,    allowNull: true },
  reportFile:     { type: DataTypes.STRING(500), allowNull: true }, // stored path on disk
  reportFileName: { type: DataTypes.STRING(255), allowNull: true }, // original filename
}, { tableName: 'lab_tests', timestamps: true });

// Auto-generate testId
LabTest.beforeCreate(async (test) => {
  const count = await LabTest.count();
  test.testId = `LT-${String(count + 1).padStart(5, '0')}`;
});

// Set completedAt when status becomes completed
LabTest.beforeSave((test) => {
  if (test.changed('status') && test.status === 'completed' && !test.completedAt) {
    test.completedAt = new Date();
  }
});

module.exports = LabTest;
module.exports.LAB_TEST_TYPES = LAB_TEST_TYPES;
