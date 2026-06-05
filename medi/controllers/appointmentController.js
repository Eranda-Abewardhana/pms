const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const LabTest = require('../models/LabTest');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// @route   POST /api/v1/appointments
exports.createAppointment = asyncHandler(async (req, res) => {
  const { patientId, doctorId, date, timeSlot, type, reason, notes } = req.body;

  const conflict = await Appointment.findOne({
    doctorId,
    date: new Date(date),
    timeSlot,
    status: { $nin: ['cancelled'] },
  });
  
  if (conflict) {
    return res.status(400).json({ success: false, message: 'This time slot is already booked' });
  }

  // Generate Queue Number for the day
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  
  const dailyCount = await Appointment.countDocuments({
    doctorId,
    date: { $gte: dayStart, $lte: dayEnd }
  });

  const count = await Appointment.countDocuments();
  const appointmentId = `APT-2025-${String(count + 1).padStart(4, '0')}`;

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

  await appointment.populate([
    { path: 'patientId' },
    { path: 'doctorId', select: 'name specialization' },
  ]);

  logActivity({ 
    userId: req.user.id, 
    userRole: req.user.role,
    action: 'APPOINTMENT_BOOKED', 
    module: 'appointments',
    description: `Booked appointment ${appointmentId} (Queue: ${appointment.queueNumber})`,
    targetId: appointment._id,
    ipAddress: req.ip 
  });

  res.status(201).json({ success: true, data: appointment });
});

// @route   GET /api/v1/appointments
exports.getAppointments = asyncHandler(async (req, res) => {
  const { status, doctorId, patientId, date, type } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (doctorId) filter.doctorId = doctorId;
  if (patientId) filter.patientId = patientId;
  if (type) filter.type = type;
  
  if (date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);
    filter.date = { $gte: d, $lt: nextDay };
  }

  if (req.user.role === 'doctor') filter.doctorId = req.user.id;

  const appointments = await Appointment.find(filter)
    .populate('patientId')
    .populate('doctorId', 'name specialization')
    .sort({ date: 1, timeSlot: 1 });

  res.status(200).json({ success: true, count: appointments.length, data: { appointments } });
});

// @route   PATCH /api/v1/appointments/:id/status
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  appointment.status = status;
  await appointment.save();

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'APPOINTMENT_STATUS_UPDATED',
    module: 'appointments',
    description: `Status changed to ${status} for ${appointment.appointmentId}`,
    targetId: appointment._id,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, data: appointment });
});

// ... (existing getMyAppointments, getAppointmentById, updateAppointment, cancelAppointment, getDoctorAvailability, getTodayAppointments)
exports.getMyAppointments = asyncHandler(async (req, res) => {
  const patientProfile = await Patient.findOne({ userId: req.user.id });
  if (!patientProfile) {
    return res.status(404).json({ success: false, message: 'Patient profile not found' });
  }
  const appointments = await Appointment.find({ patientId: patientProfile._id })
    .populate('doctorId', 'name specialization')
    .sort({ date: -1 });
  res.status(200).json({ success: true, data: { appointments } });
});

exports.getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate('patientId').populate('doctorId', 'name specialization');
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
  res.status(200).json({ success: true, data: appointment });
});

exports.updateAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('patientId').populate('doctorId', 'name specialization');
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
  res.status(200).json({ success: true, data: appointment });
});

exports.cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' });
  appointment.status = 'cancelled';
  await appointment.save();
  logActivity({ userId: req.user.id, userRole: req.user.role, action: 'APPOINTMENT_CANCELLED', module: 'appointments', description: `Cancelled appointment ${appointment.appointmentId}`, targetId: appointment._id, ipAddress: req.ip });
  res.status(200).json({ success: true, data: appointment });
});

exports.getDoctorAvailability = asyncHandler(async (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !date) return res.status(400).json({ success: false, message: 'doctorId and date are required' });
  const d = new Date(date);
  d.setHours(0,0,0,0);
  const nextDay = new Date(d); nextDay.setDate(nextDay.getDate() + 1);
  const booked = await Appointment.find({ doctorId, date: { $gte: d, $lt: nextDay }, status: { $nin: ['cancelled'] } }).select('timeSlot');
  const bookedSlots = booked.map((a) => a.timeSlot);
  const allSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
  const available = allSlots.filter((s) => !bookedSlots.includes(s));
  res.status(200).json({ success: true, data: { bookedSlots, availableSlots: available } });
});

exports.getTodayAppointments = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const filter = { date: { $gte: today, $lt: tomorrow } };
  if (req.user.role === 'doctor') filter.doctorId = req.user.id;
  const appointments = await Appointment.find(filter).populate('patientId').populate('doctorId', 'name specialization').sort({ timeSlot: 1 });
  res.status(200).json({ success: true, count: appointments.length, data: { appointments } });
});

// @route   GET /api/v1/appointments/doctor/stats
// @desc    Get dashboard stats for logged-in doctor
exports.getDoctorStats = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayCount, patientIds, pendingReports] = await Promise.all([
    Appointment.countDocuments({
      doctorId,
      date: { $gte: today, $lt: tomorrow },
      status: { $nin: ['cancelled'] },
    }),
    Appointment.distinct('patientId', { doctorId }),
    LabTest.countDocuments({ requestedBy: doctorId, status: { $in: ['pending', 'in-progress'] } }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      todayAppointments: todayCount,
      totalPatients: patientIds.length,
      pendingReports,
    },
  });
});

// @route   GET /api/v1/appointments/doctor/patients
// @desc    Get all patients who have/had appointments with logged-in doctor
exports.getDoctorPatients = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;
  const { search } = req.query;

  const patientIds = await Appointment.distinct('patientId', { doctorId });

  const filter = { _id: { $in: patientIds } };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { patientId: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const patients = await Patient.find(filter).sort({ name: 1 });

  res.status(200).json({
    success: true,
    count: patients.length,
    data: { patients },
  });
});
