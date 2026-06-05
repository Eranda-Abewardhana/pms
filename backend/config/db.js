// ================================================================
// DATABASE CONNECTION (MySQL via Sequelize)
// Previously: Mongoose connection
// ================================================================

/* ── COMMENTED OUT: MongoDB/Mongoose connection ──────────────────
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
─────────────────────────────────────────────────── END MONGOOSE */

const sequelize = require('./sequelize');

// Import all models so they register on the sequelize instance
// and associations are set up before sync()
require('../models/User');
require('../models/Patient');
require('../models/Appointment');
require('../models/EMR');
require('../models/Invoice');
require('../models/LabTest');
require('../models/LabReport');
require('../models/Vitals');
require('../models/Payment');
require('../models/Feedback');
require('../models/Inventory');
require('../models/ActivityLog');
require('../models/SystemConfig');

// Set up cross-model associations
const User        = sequelize.models.User;
const Patient     = sequelize.models.Patient;
const Appointment = sequelize.models.Appointment;
const EMR         = sequelize.models.EMR;
const Invoice     = sequelize.models.Invoice;
const LabTest     = sequelize.models.LabTest;
const LabReport   = sequelize.models.LabReport;
const Vitals      = sequelize.models.Vitals;
const Payment     = sequelize.models.Payment;
const Feedback    = sequelize.models.Feedback;
const Inventory   = sequelize.models.Inventory;
const ActivityLog = sequelize.models.ActivityLog;
const SystemConfig = sequelize.models.SystemConfig;

// ── Patient <-> User ──────────────────────────────────────────────
Patient.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Patient,    { foreignKey: 'userId', as: 'patientProfile' });

Patient.belongsTo(User, { foreignKey: 'registeredBy', as: 'registeredByUser' });

// ── Appointment <-> Patient, User(doctor) ─────────────────────────
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Patient.hasMany(Appointment,   { foreignKey: 'patientId', as: 'appointments' });

Appointment.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });
User.hasMany(Appointment,   { foreignKey: 'doctorId', as: 'doctorAppointments' });

// ── EMR <-> Patient, User(doctor), Appointment ───────────────────
EMR.belongsTo(Patient,     { foreignKey: 'patientId', as: 'patient' });
EMR.belongsTo(User,        { foreignKey: 'doctorId',  as: 'doctor' });
EMR.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

// ── Invoice <-> Patient, Appointment, User(cashier) ───────────────
Invoice.belongsTo(Patient,     { foreignKey: 'patientId',   as: 'patient' });
Invoice.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Invoice.belongsTo(LabTest,     { foreignKey: 'labTestId',    as: 'labTest' });
Invoice.belongsTo(User,        { foreignKey: 'processedBy',  as: 'processor' });
Patient.hasMany(Invoice,       { foreignKey: 'patientId',    as: 'invoices' });

// ── LabTest <-> Patient, User(doctor), User(labtech), Appointment ─
LabTest.belongsTo(Patient,     { foreignKey: 'patientId',    as: 'patient' });
LabTest.belongsTo(User,        { foreignKey: 'requestedBy',  as: 'requestedByUser' });
LabTest.belongsTo(User,        { foreignKey: 'assignedTo',   as: 'assignedToUser' });
LabTest.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Patient.hasMany(LabTest,       { foreignKey: 'patientId',    as: 'labTests' });

// ── LabReport <-> Patient, User(doctor), User(uploader), EMR ─────
LabReport.belongsTo(Patient, { foreignKey: 'patientId',      as: 'patient' });
LabReport.belongsTo(User,    { foreignKey: 'requestedBy',    as: 'requestedByUser' });
LabReport.belongsTo(User,    { foreignKey: 'uploadedBy',     as: 'uploadedByUser' });
LabReport.belongsTo(EMR,     { foreignKey: 'medicalRecordId', as: 'medicalRecord' });

// ── Vitals <-> Patient, User(nurse), Appointment ─────────────────
Vitals.belongsTo(Patient,     { foreignKey: 'patientId',    as: 'patient' });
Vitals.belongsTo(User,        { foreignKey: 'nurseId',       as: 'nurse' });
Vitals.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Patient.hasMany(Vitals,       { foreignKey: 'patientId',    as: 'vitals' });

// ── Payment <-> Patient, Appointment, User(cashier) ──────────────
Payment.belongsTo(Patient,     { foreignKey: 'patientId',   as: 'patient' });
Payment.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });
Payment.belongsTo(User,        { foreignKey: 'processedBy',  as: 'processor' });

// ── Feedback <-> Patient, User(doctor), Appointment ──────────────
Feedback.belongsTo(Patient,     { foreignKey: 'patientId',   as: 'patient' });
Feedback.belongsTo(User,        { foreignKey: 'doctorId',     as: 'doctor' });
Feedback.belongsTo(Appointment, { foreignKey: 'appointmentId', as: 'appointment' });

// ── ActivityLog <-> User ──────────────────────────────────────────
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Inventory <-> User(addedBy) ───────────────────────────────────
Inventory.belongsTo(User, { foreignKey: 'addedBy', as: 'addedByUser' });

// ── SystemConfig <-> User(updatedBy) ─────────────────────────────
SystemConfig.belongsTo(User, { foreignKey: 'updatedBy', as: 'updatedByUser' });

// ── Connect and sync ─────────────────────────────────────────────
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Connected successfully via Sequelize.');

    // { force: false } = create tables if not exist, don't drop
    await sequelize.sync({ alter: true });
    console.log('All MySQL tables synced.');
  } catch (error) {
    console.error(`Error connecting to MySQL:`, error);
    process.exit(1);
  }
};

module.exports = connectDB;
