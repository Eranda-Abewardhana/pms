const { Op } = require('sequelize');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const LabTest = require('../models/LabTest');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// @route   POST /api/v1/appointments
exports.createAppointment = asyncHandler(async (req, res) => {
  const { patientId, doctorId, date, timeSlot, type, reason, notes } = req.body;

  const conflict = await Appointment.findOne({
    where: {
      doctorId,
      date: new Date(date),
      timeSlot,
      status: { [Op.notIn]: ['cancelled'] },
    },
  });

  if (conflict) {
    return res.status(400).json({ success: false, message: 'This time slot is already booked' });
  }

  // Generate Queue Number for the day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const [dailyCount, totalCount] = await Promise.all([
    Appointment.count({
      where: {
        doctorId,
        date: { [Op.between]: [dayStart, dayEnd] },
      },
    }),
    Appointment.count(),
  ]);

  const appointmentId = `APT-2025-${String(totalCount + 1).padStart(4, '0')}`;

  const appointment = await Appointment.create({
    appointmentId,
    patientId,
    doctorId,
    date: new Date(date),
    timeSlot,
    type: type || 'OPD',
    reason,
    notes,
    queueNumber: dailyCount + 1,
    bookedBy: req.user.role === 'patient' ? 'patient' : 'receptionist',
  });

  // Re-fetch with associations
  const populated = await Appointment.findByPk(appointment.id, {
    include: [
      { model: Patient, as: 'patient' },
      { model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
    ],
  });

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'APPOINTMENT_BOOKED',
    module: 'appointments',
    description: `Booked appointment ${appointmentId} (Queue: ${appointment.queueNumber})`,
    targetId: appointment.id,
    ipAddress: req.ip
  });

  res.status(201).json({ success: true, data: populated });
});

// @route   GET /api/v1/appointments
exports.getAppointments = asyncHandler(async (req, res) => {
  const { status, doctorId, patientId, date, type } = req.query;
  const where = {};

  if (status) where.status = status;
  if (doctorId) where.doctorId = doctorId;
  if (patientId) where.patientId = patientId;
  if (type) where.type = type;

  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    where.date = { [Op.gte]: d, [Op.lt]: nextDay };
  }

  if (req.user.role === 'doctor') where.doctorId = req.user.id;

  const appointments = await Appointment.findAll({
    where,
    include: [
      { model: Patient, as: 'patient' },
      { model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
    ],
    order: [['date', 'ASC'], ['timeSlot', 'ASC']],
  });

  res.status(200).json({ success: true, count: appointments.length, data: { appointments } });
});

// @route   PATCH /api/v1/appointments/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const appointment = await Appointment.findByPk(req.params.id);

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  await appointment.update({ status });

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'APPOINTMENT_STATUS_UPDATED',
    module: 'appointments',
    description: `Status changed to ${status} for ${appointment.appointmentId}`,
    targetId: appointment.id,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, data: appointment });
});

// @route   GET /api/v1/appointments/my
exports.getMyAppointments = asyncHandler(async (req, res) => {
  const patientProfile = await Patient.findOne({ where: { userId: req.user.id } });
  if (!patientProfile) {
    return res.status(404).json({ success: false, message: 'Patient profile not found' });
  }

  const appointments = await Appointment.findAll({
    where: { patientId: patientProfile.id },
    include: [{ model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] }],
    order: [['date', 'DESC']],
  });

  res.status(200).json({ success: true, data: { appointments } });
});

// @route   GET /api/v1/appointments/:id
exports.getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByPk(req.params.id, {
    include: [
      { model: Patient, as: 'patient' },
      { model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
    ],
  });
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
  res.status(200).json({ success: true, data: appointment });
});

// @route   PUT /api/v1/appointments/:id
exports.updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

  await appointment.update(req.body);

  const populated = await Appointment.findByPk(appointment.id, {
    include: [
      { model: Patient, as: 'patient' },
      { model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
    ],
  });

  res.status(200).json({ success: true, data: populated });
});

// @route   PATCH /api/v1/appointments/:id/cancel
exports.cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByPk(req.params.id);
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });

  await appointment.update({ status: 'cancelled' });

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'APPOINTMENT_CANCELLED',
    module: 'appointments',
    description: `Cancelled appointment ${appointment.appointmentId}`,
    targetId: appointment.id,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, data: appointment });
});

// @route   GET /api/v1/appointments/availability?doctorId=&date=
exports.getDoctorAvailability = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !date) return res.status(400).json({ success: false, message: 'doctorId and date are required' });

  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const nextDay = new Date(d);
  nextDay.setDate(nextDay.getDate() + 1);

  const booked = await Appointment.findAll({
    where: {
      doctorId,
      date: { [Op.gte]: d, [Op.lt]: nextDay },
      status: { [Op.notIn]: ['cancelled'] },
    },
    attributes: ['timeSlot'],
  });

  const bookedSlots = booked.map((a) => a.timeSlot);
  const allSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  const available = allSlots.filter((s) => !bookedSlots.includes(s));

  res.status(200).json({ success: true, data: { bookedSlots, availableSlots: available } });
});

// @route   GET /api/v1/appointments/today
exports.getTodayAppointments = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const where = { date: { [Op.gte]: today, [Op.lt]: tomorrow } };
  if (req.user.role === 'doctor') where.doctorId = req.user.id;

  const appointments = await Appointment.findAll({
    where,
    include: [
      { model: Patient, as: 'patient' },
      { model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
    ],
    order: [['timeSlot', 'ASC']],
  });

  res.status(200).json({ success: true, count: appointments.length, data: { appointments } });
});

// @route   GET /api/v1/appointments/doctor/stats
exports.getDoctorStats = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayCount, totalPatientsResult, pendingReports] = await Promise.all([
    Appointment.count({
      where: {
        doctorId,
        date: { [Op.gte]: today, [Op.lt]: tomorrow },
        status: { [Op.notIn]: ['cancelled'] },
      },
    }),
    // Count distinct patients for this doctor
    Appointment.findAll({
      where: { doctorId },
      attributes: ['patientId'],
      group: ['patientId'],
    }),
    LabTest.count({
      where: {
        requestedBy: doctorId,
        status: { [Op.in]: ['pending', 'in-progress'] },
      },
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      todayAppointments: todayCount,
      totalPatients: totalPatientsResult.length,
      pendingReports,
    },
  });
});

// @route   GET /api/v1/appointments/doctor/patients
exports.getDoctorPatients = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;
  const { search } = req.query;

  // Get distinct patient IDs for this doctor
  const patientRows = await Appointment.findAll({
    where: { doctorId },
    attributes: ['patientId'],
    group: ['patientId'],
  });
  const patientIds = patientRows.map((r) => r.patientId);

  if (!patientIds.length) {
    return res.status(200).json({ success: true, count: 0, data: { patients: [] } });
  }

  const where = { id: { [Op.in]: patientIds } };
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { patientId: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }

  const patients = await Patient.findAll({ where, order: [['name', 'ASC']] });

  res.status(200).json({
    success: true,
    count: patients.length,
    data: { patients },
  });
});
