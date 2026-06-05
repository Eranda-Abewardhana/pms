// ================================================================
// SEED FILE — MySQL / Sequelize
// Data source: utils/seeds.json
// Run: npm run seed
// ================================================================

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt      = require('bcryptjs');
const path        = require('path');
const sequelize   = require('../config/sequelize');
const seedData    = require('./seeds.json');        // ← all data lives here

const User        = require('../models/User');
const Patient     = require('../models/Patient');
const Appointment = require('../models/Appointment');
const EMR         = require('../models/EMR');
const LabReport   = require('../models/LabReport');
const LabTest     = require('../models/LabTest');
const Invoice     = require('../models/Invoice');
const Feedback    = require('../models/Feedback');
const Inventory   = require('../models/Inventory');
const ActivityLog = require('../models/ActivityLog');
const Vitals      = require('../models/Vitals');

// ── helpers ──────────────────────────────────────────────────────
const hashPwd = (pwd) => bcrypt.hash(pwd, 10);

const connectAndSeed = async () => {
  try {
    await sequelize.authenticate();
    console.log('✔  MySQL connected.\n');

    await sequelize.sync({ force: false });
    console.log('✔  Tables synced.\n');

    // ── 1. Clear tables (reverse FK order) ───────────────────────
    console.log('🗑  Clearing existing data …');
    await Feedback.destroy({ where: {} });
    await LabReport.destroy({ where: {} });
    await LabTest.destroy({ where: {} });           // clear lab tests
    await Vitals.destroy({ where: {} });            // clear vitals
    await Invoice.destroy({ where: {} });
    await EMR.destroy({ where: {} });
    await Appointment.destroy({ where: {} });
    await Patient.destroy({ where: {} });
    await ActivityLog.destroy({ where: {} });       // must clear before users (FK)
    await User.destroy({ where: {} });
    await Inventory.destroy({ where: {} });
    console.log('✔  Cleared.\n');

    // ── 2. Staff users ────────────────────────────────────────────
    console.log('👥  Creating staff users …');
    const staffPwd = await hashPwd('Pms@123');
    const staffRaw = seedData.staff.map((s) => ({
      ...s,
      password:        staffPwd,   // pre-hashed — bulkCreate skips beforeCreate hooks
      isActive:        true,
      isEmailVerified: true,
    }));

    const staffUsers = await User.bulkCreate(staffRaw, {
      individualHooks: false,
      returning: true,
    });
    console.log(`  ✓ ${staffUsers.length} staff users`);

    // Index staff by their position in seeds.json for FK lookups
    const staffById = staffUsers.map((u) => u.id);   // staffById[0] = id of seeds.staff[0]
    // Role-keyed id arrays (for fallback lookups)
    const byRole = {};
    for (const u of staffUsers) {
      byRole[u.role] = byRole[u.role] || [];
      byRole[u.role].push(u.id);
    }

    // ── 3. Patient users + profiles ───────────────────────────────
    console.log('\n🏥  Creating patients …');
    const patientPwd  = await hashPwd('Patient@123');
    const patientUsers = await User.bulkCreate(
      seedData.patients.map((p) => ({
        name:            p.name,
        email:           p.email,
        password:        patientPwd,  // pre-hashed
        role:            'patient',
        phone:           p.phone,
        nic:             p.nic,
        isActive:        true,
        isEmailVerified: true,
      })),
      { individualHooks: false, returning: true }
    );
    console.log(`  ✓ ${patientUsers.length} patient users`);

    const patientProfiles = await Patient.bulkCreate(
      seedData.patients.map((p, i) => ({
        userId:            patientUsers[i].id,
        patientId:         p.patientId,
        name:              p.name,
        email:             p.email,
        phone:             p.phone,
        nic:               p.nic,
        dateOfBirth:       p.dateOfBirth,
        age:               p.age,
        gender:            p.gender,
        bloodGroup:        p.bloodGroup,
        address:           p.address,
        allergies:         p.allergies,
        chronicConditions: p.chronicConditions,
        isActive:          true,
        registeredBy:      byRole.receptionist?.[0] ?? byRole.admin[0],
      })),
      { individualHooks: false, returning: true }
    );
    console.log(`  ✓ ${patientProfiles.length} patient profiles`);

    // patientDbIds[i] = DB id of seeds.patients[i]
    const patientDbIds = patientProfiles.map((p) => p.id);

    // ── 4. Appointments ───────────────────────────────────────────
    console.log('\n📅  Creating appointments …');
    const appointments = await Appointment.bulkCreate(
      seedData.appointments.map((a, i) => ({
        appointmentId: `APT-2025-${String(i).padStart(4, '0')}`,
        patientId:     patientDbIds[a.patientIdx],
        doctorId:      staffById[a.doctorIdx],
        date:          new Date(a.date),
        timeSlot:      a.timeSlot,
        type:          a.type,
        status:        a.status,
        reason:        a.reason,
        bookedBy:      a.bookedBy,
        paymentStatus: a.paymentStatus,
      })),
      { individualHooks: false, returning: true }
    );
    console.log(`  ✓ ${appointments.length} appointments`);

    // aptDbIds[i] = DB id of seeds.appointments[i]
    const aptDbIds = appointments.map((a) => a.id);

    // ── 5. EMR ───────────────────────────────────────────────────
    console.log('\n📋  Creating EMRs …');
    const nurseId = byRole.nurse?.[0] ?? byRole.admin[0];
    const emrsRaw = seedData.emr.map((e, i) => {
      const apt = seedData.appointments[e.appointmentIdx];
      return {
        recordId:       `REC-2025-${String(i).padStart(4, '0')}`,
        patientId:      patientDbIds[apt.patientIdx],
        appointmentId:  aptDbIds[e.appointmentIdx],
        doctorId:       staffById[apt.doctorIdx],
        visitDate:      new Date(apt.date),
        visitType:      'OPD',
        chiefComplaint: e.chiefComplaint,
        diagnosis:      e.diagnosis,
        symptoms:       e.symptoms,
        vitals:         { ...e.vitals, recordedBy: nurseId },
        prescriptions:  e.prescriptions,
        doctorNotes:    e.doctorNotes,
        followUpDate:   e.followUpDate || null,
        isFinalized:    true,
      };
    });
    await EMR.bulkCreate(emrsRaw, { individualHooks: false });
    console.log(`  ✓ ${emrsRaw.length} EMRs`);

    // ── 6. Lab Reports ───────────────────────────────────────────
    console.log('\n🔬  Creating lab reports …');
    const labsRaw = seedData.labReports.map((l, i) => {
      const apt = seedData.appointments[l.appointmentIdx];
      return {
        reportId:    `LAB-2025-${String(i).padStart(4, '0')}`,
        patientId:   patientDbIds[apt.patientIdx],
        requestedBy: staffById[apt.doctorIdx],
        testName:    l.testName,
        testCategory:l.testCategory,
        status:      l.status,
        results:     l.results,
        notes:       l.notes,
        completedDate: l.status === 'completed' ? new Date() : null,
      };
    });
    await LabReport.bulkCreate(labsRaw, { individualHooks: false });
    console.log(`  ✓ ${labsRaw.length} lab reports`);

    // ── 7. Invoices ──────────────────────────────────────────────
    console.log('\n💳  Creating invoices …');
    const cashierId = byRole.cashier?.[0] ?? byRole.admin[0];
    let invCount = 0;
    for (const [i, apt] of appointments.entries()) {
      invCount++;
      const amount     = 2500;                       // fixed consultation fee
      const isPaid     = apt.paymentStatus === 'paid';
      const paidAmount = isPaid ? amount : 0;
      await Invoice.create({
        patientId:     apt.patientId,
        appointmentId: apt.id,
        items: [{ description: 'Consultation Fee', unitPrice: amount, quantity: 1, amount, category: 'consultation' }],
        subtotal:     amount,
        taxRate:      0,
        taxAmount:    0,
        discount:     0,
        totalAmount:  amount,
        paidAmount,
        balanceDue:   amount - paidAmount,
        status:       isPaid ? 'paid' : 'unpaid',
        paymentMethod: isPaid ? 'cash' : null,
        processedBy:   isPaid ? cashierId : null,
        paidAt:        isPaid ? new Date() : null,
      });
    }
    console.log(`  ✓ ${invCount} invoices`);

    // ── 8. Feedback ──────────────────────────────────────────────
    console.log('\n💬  Creating feedback …');
    const feedbackRaw = seedData.feedback.map((f, i) => ({
      feedbackId:    `FDB-2025-${String(i).padStart(4, '0')}`,
      patientId:     patientDbIds[f.patientIdx],
      appointmentId: aptDbIds[f.appointmentIdx],
      doctorId:      staffById[f.doctorIdx],
      overallRating: f.overallRating,
      doctorRating:  f.doctorRating,
      serviceRating: f.serviceRating,
      waitTimeRating:f.waitTimeRating,
      comment:       f.comment,
      isPublished:   f.isPublished,
    }));
    await Feedback.bulkCreate(feedbackRaw, { individualHooks: false });
    console.log(`  ✓ ${feedbackRaw.length} feedback entries`);

    // ── 9. Inventory ─────────────────────────────────────────────
    console.log('\n📦  Creating inventory …');
    const inventoryRaw = seedData.inventory.map((item) => ({
      ...item,
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
      isActive:   true,
      addedBy:    byRole.admin[0],
    }));
    await Inventory.bulkCreate(inventoryRaw, { individualHooks: false });
    console.log(`  ✓ ${inventoryRaw.length} inventory items`);

    // ── 10. Lab Tests (LabTest model) ──────────────────────────────────
    if (seedData.labTests && seedData.labTests.length > 0) {
      console.log('\n🔬  Creating lab tests …');
      const labTestsRaw = seedData.labTests.map((lt, i) => {
        const completedStatuses = ['completed'];
        return {
          testId:        `LT-${String(i + 1).padStart(5, '0')}`,
          patientId:     patientDbIds[lt.patientIdx],
          requestedBy:   staffById[lt.doctorIdx],
          appointmentId: lt.aptIdx !== null ? aptDbIds[lt.aptIdx] : null,
          testType:      lt.testType,
          priority:      lt.priority,
          status:        lt.status,
          clinicalNotes: lt.clinicalNotes,
          results:       lt.results ?? null,
          resultSummary: lt.resultSummary ?? null,
          isAbnormal:    lt.isAbnormal ?? false,
          completedAt:   completedStatuses.includes(lt.status) ? new Date() : null,
        };
      });
      await LabTest.bulkCreate(labTestsRaw, { individualHooks: false });
      console.log(`  ✓ ${labTestsRaw.length} lab tests`);
    }

    // ── 11. Vitals ───────────────────────────────────────────────
    if (seedData.vitals && seedData.vitals.length > 0) {
      console.log('\n💓  Creating vitals …');
      const nurseId = byRole.nurse?.[0] ?? byRole.admin[0];
      const vitalsRaw = seedData.vitals.map((v) => {
        const hM = v.height?.value / 100;
        const bmi = (v.weight?.value && v.height?.value)
          ? parseFloat((v.weight.value / (hM * hM)).toFixed(1))
          : null;
        return {
          patientId:        patientDbIds[v.patientIdx],
          nurseId:          staffById[v.nurseIdx] ?? nurseId,
          appointmentId:    v.aptIdx !== null ? aptDbIds[v.aptIdx] : null,
          temperature:      v.temperature,
          bloodPressure:    v.bloodPressure,
          pulse:            v.pulse,
          respiratoryRate:  v.respiratoryRate,
          oxygenSaturation: v.oxygenSaturation,
          weight:           v.weight,
          height:           v.height,
          bmi,
          notes:            v.notes,
          recordedAt:       new Date(v.recordedAt),
        };
      });
      await Vitals.bulkCreate(vitalsRaw, { individualHooks: false });
      console.log(`  ✓ ${vitalsRaw.length} vitals records`);
    }

    // ── Done ──────────────────────────────────────────────────────
    console.log('\n✅  Seeding complete!\n');
    console.log('  Staff password  : Pms@123');
    console.log('  Patient password: Patient@123');
    console.log('\n  Guaranteed test logins:');
    for (const s of seedData.staff) {
      console.log(`    ${s.role.padEnd(14)} → ${s.email}`);
    }

  } catch (err) {
    console.error('\n❌  Seed error:', err.message);
    if (err.errors) err.errors.forEach((e) => console.error('   ↳', e.message));
    console.error(err.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

connectAndSeed();
