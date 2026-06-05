require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const EMR = require('../models/EMR');
const LabReport = require('../models/LabReport');
const Invoice = require('../models/Invoice');
const Feedback = require('../models/Feedback');
const Inventory = require('../models/Inventory');
const ActivityLog = require('../models/ActivityLog');
const fs = require('fs');
const path = require('path');

// Actual credentials for each seeded user
const USER_PASSWORDS = {
  'admin@pms.com':     'Admin@123',
  'doctor@pms.com':    'Doctor@123',
  'patient@pms.com':   'Patient@123',
  'reception@pms.com': 'Reception@123',
  'nurse@pms.com':     'Nurse@123',
  'cashier@pms.com':   'Cashier@123',
  'labtech@pms.com':   'Labtech@123',
};

const seedData = JSON.parse(fs.readFileSync(path.join(__dirname, 'seed_data.json'), 'utf-8'));

const connectAndSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Appointment.deleteMany({});
    await EMR.deleteMany({});
    await LabReport.deleteMany({});
    await Invoice.deleteMany({});
    await Feedback.deleteMany({});
    await Inventory.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('Cleared existing data.');

    // Helper to fix JSON $date and $oid into Mongoose format
    const fixData = (arr) => arr.map(item => {
      const newItem = { ...item };
      if (newItem._id && newItem._id.$oid) newItem._id = newItem._id.$oid;
      
      // Recursively fix dates and oids
      const recurse = (obj) => {
        for (let key in obj) {
          if (obj[key] && typeof obj[key] === 'object') {
            if (obj[key].$date) {
              obj[key] = new Date(obj[key].$date);
            } else if (obj[key].$oid) {
              obj[key] = obj[key].$oid;
            } else {
              recurse(obj[key]);
            }
          }
        }
      };
      recurse(newItem);
      return newItem;
    });

    // insertMany bypasses the pre-save bcrypt hook, so we hash each password manually.
    const salt = await bcrypt.genSalt(10);
    const usersRaw = fixData(seedData.users);
    const users = await Promise.all(
      usersRaw.map(async (u) => {
        const plainPassword = USER_PASSWORDS[u.email] || 'Default@123';
        const hashedPassword = await bcrypt.hash(plainPassword, salt);
        return { ...u, password: hashedPassword };
      })
    );
    await User.insertMany(users);
    console.log(`  ✓ Inserted ${users.length} users`);

    // Insert Patients
    const patients = fixData(seedData.patients);
    await Patient.insertMany(patients);
    console.log(`  ✓ Inserted ${patients.length} patients`);

    // Insert Appointments
    const appointments = fixData(seedData.appointments);
    await Appointment.insertMany(appointments);
    console.log(`  ✓ Inserted ${appointments.length} appointments`);

    // Insert Medical Records (EMR)
    const medicalrecords = fixData(seedData.medicalrecords || []);
    if (medicalrecords.length) {
      await EMR.insertMany(medicalrecords);
      console.log(`  ✓ Inserted ${medicalrecords.length} medical records`);
    } else {
      console.log('  - No medical records to seed');
    }

    // Insert Lab Reports
    const labreports = fixData(seedData.labreports || []);
    if (labreports.length) {
      await LabReport.insertMany(labreports);
      console.log(`  ✓ Inserted ${labreports.length} lab reports`);
    } else {
      console.log('  - No lab reports to seed');
    }

    // Insert Invoices/Payments — map seed fields to Invoice schema
    const paymentsRaw = fixData(seedData.payments || []);
    const invoices = paymentsRaw.map((p) => ({
      _id: p._id,
      invoiceId: p.paymentId,
      patient: p.patientId,           // Invoice uses 'patient' not 'patientId'
      appointment: p.appointmentId,   // Invoice uses 'appointment' not 'appointmentId'
      items: (p.items || []).map((item) => ({
        description: item.description,
        unitPrice: item.amount,        // treat full amount as unit price (qty=1)
        quantity: 1,
        amount: item.amount,
        category: 'other',
      })),
      subtotal: p.subtotal || 0,
      discount: p.discount || 0,
      totalAmount: p.totalAmount || 0,
      paidAmount: p.paymentStatus === 'paid' ? (p.totalAmount || 0) : 0,
      balanceDue: p.paymentStatus === 'paid' ? 0 : (p.totalAmount || 0),
      status: p.paymentStatus === 'paid' ? 'paid' : 'unpaid',
      paymentMethod: p.paymentMethod || undefined,
      processedBy: p.processedBy || undefined,
      paidAt: p.paidAt || undefined,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
    if (invoices.length) {
      await Invoice.insertMany(invoices);
      console.log(`  ✓ Inserted ${invoices.length} invoices/payments`);
    } else {
      console.log('  - No payments to seed');
    }

    // Insert Feedbacks
    const feedbacks = fixData(seedData.feedbacks);
    await Feedback.insertMany(feedbacks);
    console.log(`  ✓ Inserted ${feedbacks.length} feedbacks`);

    // Insert Inventory
    const inventory = fixData(seedData.inventory);
    await Inventory.insertMany(inventory);
    console.log(`  ✓ Inserted ${inventory.length} inventory items`);

    // Insert Activity Logs
    const activitylogs = fixData(seedData.activitylogs || []);
    if (activitylogs.length) {
      await ActivityLog.insertMany(activitylogs);
      console.log(`  ✓ Inserted ${activitylogs.length} activity logs`);
    } else {
      console.log('  - No activity logs to seed');
    }

    console.log('\n✅ Seeding complete! Login credentials:');
    console.log('   admin@pms.com      → Admin@123');
    console.log('   doctor@pms.com     → Doctor@123');
    console.log('   patient@pms.com    → Patient@123');
    console.log('   reception@pms.com  → Reception@123');
    console.log('   nurse@pms.com      → Nurse@123');
    console.log('   cashier@pms.com    → Cashier@123');
    console.log('   labtech@pms.com    → Labtech@123');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

connectAndSeed();
