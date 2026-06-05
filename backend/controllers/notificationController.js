const { Op } = require('sequelize');
const Appointment = require('../models/Appointment');
const LabTest = require('../models/LabTest');
const Patient = require('../models/Patient');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get notifications for the logged-in user
// @route   GET /api/v1/notifications
// @access  Private (all roles)
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;
  const notifications = [];
  const now = new Date();
  const since = new Date(now - 7 * 24 * 60 * 60 * 1000); // last 7 days

  if (role === 'patient') {
    // Find patient profile
    const patient = await Patient.findOne({ where: { userId } });

    if (patient) {
      // Upcoming appointments
      const upcoming = await Appointment.findAll({
        where: {
          patientId: patient.id,
          date: { [Op.gte]: now },
          status: { [Op.in]: ['booked', 'confirmed'] },
        },
        include: [{ model: User, as: 'doctor', attributes: ['name', 'specialization'] }],
        order: [['date', 'ASC']],
        limit: 5,
      });
      upcoming.forEach((apt) => {
        notifications.push({
          id: `apt-${apt.id}`,
          type: 'appointment',
          title: 'Upcoming Appointment',
          message: `With Dr. ${apt.doctor?.name || 'Unknown'} on ${new Date(apt.date).toLocaleDateString()} at ${apt.timeSlot}`,
          time: apt.createdAt,
          read: false,
        });
      });

      // Completed lab tests
      const labResults = await LabTest.findAll({
        where: {
          patientId: patient.id,
          status: 'completed',
          completedAt: { [Op.gte]: since },
        },
        order: [['completedAt', 'DESC']],
        limit: 5,
      });
      labResults.forEach((lt) => {
        notifications.push({
          id: `lab-${lt.id}`,
          type: 'lab',
          title: 'Lab Report Ready',
          message: `${lt.testType} results are available${lt.isAbnormal ? ' — Abnormal values detected' : ''}`,
          time: lt.completedAt,
          read: false,
          isAbnormal: lt.isAbnormal,
        });
      });
    }
  } else if (role === 'doctor') {
    // Today's appointments for doctor
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayApts = await Appointment.findAll({
      where: {
        doctorId: userId,
        date: { [Op.between]: [today, tomorrow] },
        status: { [Op.in]: ['booked', 'confirmed', 'arrived'] },
      },
      include: [{ model: Patient, as: 'patient', attributes: ['name', 'patientId'] }],
      order: [['date', 'ASC']],
      limit: 5,
    });
    todayApts.forEach((apt) => {
      notifications.push({
        id: `apt-${apt.id}`,
        type: 'appointment',
        title: 'Patient Waiting',
        message: `${apt.patient?.name || 'Patient'} (${apt.patient?.patientId || ''}) is scheduled at ${apt.timeSlot}`,
        time: apt.createdAt,
        read: false,
      });
    });

    // Completed lab tests for doctor's patients
    const patientRows = await Appointment.findAll({
      where: { doctorId: userId },
      attributes: ['patientId'],
      group: ['patientId'],
    });
    const patientIds = patientRows.map((r) => r.patientId);
    if (patientIds.length > 0) {
      const newLabs = await LabTest.findAll({
        where: {
          patientId: { [Op.in]: patientIds },
          status: 'completed',
          completedAt: { [Op.gte]: since },
        },
        include: [{ model: Patient, as: 'patient', attributes: ['name'] }],
        order: [['completedAt', 'DESC']],
        limit: 5,
      });
      newLabs.forEach((lt) => {
        notifications.push({
          id: `lab-${lt.id}`,
          type: 'lab',
          title: 'Lab Result Available',
          message: `${lt.testType} for ${lt.patient?.name || 'patient'} completed${lt.isAbnormal ? ' — ⚠ Abnormal' : ''}`,
          time: lt.completedAt,
          read: false,
          isAbnormal: lt.isAbnormal,
        });
      });
    }
  } else if (role === 'nurse') {
    // Arrived patients (to prepare for consultation)
    const arrived = await Appointment.findAll({
      where: {
        status: 'arrived',
        date: { [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      include: [{ model: Patient, as: 'patient', attributes: ['name'] }],
      order: [['date', 'ASC']],
      limit: 5,
    });
    arrived.forEach((apt) => {
      notifications.push({
        id: `apt-${apt.id}`,
        type: 'appointment',
        title: 'Patient Arrived',
        message: `${apt.patient?.name || 'Patient'} has arrived and needs vitals recorded`,
        time: apt.updatedAt,
        read: false,
      });
    });
  } else if (role === 'labtech') {
    // Pending lab tests
    const pending = await LabTest.findAll({
      where: { status: 'pending' },
      include: [{ model: Patient, as: 'patient', attributes: ['name'] }],
      order: [['priority', 'ASC'], ['createdAt', 'ASC']],
      limit: 10,
    });
    pending.forEach((lt) => {
      notifications.push({
        id: `lab-${lt.id}`,
        type: 'lab',
        title: `${lt.priority === 'stat' ? '🚨 STAT' : lt.priority === 'urgent' ? '⚠ Urgent' : 'Pending'} Test`,
        message: `${lt.testType} for ${lt.patient?.name || 'patient'} — ${lt.priority}`,
        time: lt.createdAt,
        read: false,
        isUrgent: lt.priority !== 'routine',
      });
    });
  } else if (role === 'receptionist') {
    // Today's appointments for awareness
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayApts = await Appointment.findAll({
      where: { date: { [Op.between]: [today, tomorrow] } },
      order: [['date', 'ASC']],
      limit: 10,
    });
    notifications.push({
      id: 'schedule-today',
      type: 'schedule',
      title: "Today's Schedule",
      message: `${todayApts.length} appointment${todayApts.length !== 1 ? 's' : ''} scheduled for today`,
      time: new Date(),
      read: false,
    });
  } else if (role === 'cashier') {
    // Unpaid invoices
    const Invoice = require('../models/Invoice');
    const unpaid = await Invoice.count({ where: { status: 'pending' } });
    if (unpaid > 0) {
      notifications.push({
        id: 'unpaid-invoices',
        type: 'billing',
        title: 'Pending Payments',
        message: `${unpaid} invoice${unpaid > 1 ? 's' : ''} pending payment`,
        time: new Date(),
        read: false,
      });
    }
  }

  // Sort by time desc, limit 10
  notifications.sort((a, b) => new Date(b.time) - new Date(a.time));
  const result = notifications.slice(0, 10);

  res.status(200).json({
    success: true,
    data: {
      notifications: result,
      unreadCount: result.length,
    },
  });
});
