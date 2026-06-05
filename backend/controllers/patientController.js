const { Op, fn, col, literal } = require('sequelize');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const LabTest = require('../models/LabTest');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// ─────────────────────────────────────────────────────────────
// @desc    Register a new patient (by Receptionist/Admin)
// @route   POST /api/v1/patients
// @access  Private/Receptionist/Admin
// ─────────────────────────────────────────────────────────────
exports.registerPatient = asyncHandler(async (req, res) => {
  const {
    name, email, phone, nic, dateOfBirth, gender,
    bloodGroup, address, guardian, allergies, chronicConditions
  } = req.body;

  // Duplicate checking
  if (nic) {
    const existingByNic = await Patient.findOne({ where: { nic } });
    if (existingByNic) {
      return res.status(400).json({ success: false, message: `Patient with NIC ${nic} already exists (${existingByNic.patientId})` });
    }
  }

  if (email) {
    const existingByEmail = await Patient.findOne({ where: { email } });
    if (existingByEmail) {
      return res.status(400).json({ success: false, message: 'A patient with this email already exists' });
    }
  }

  // Generate unique Patient ID
  const count = await Patient.count();
  const year = new Date().getFullYear();
  const patientId = `MMC-${year}-${String(count + 1).padStart(4, '0')}`;

  const patient = await Patient.create({
    patientId,
    name,
    email,
    phone,
    nic,
    dateOfBirth,
    gender,
    bloodGroup,
    address,
    guardian,
    allergies,
    chronicConditions,
    registeredBy: req.user.id,
  });

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'REGISTER_PATIENT',
    module: 'patients',
    description: `Registered patient ${name} (${patientId})`,
    targetId: patient.id,
    ipAddress: req.ip
  });

  res.status(201).json({ success: true, data: patient });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get all patients with search/filtering
// @route   GET /api/v1/patients
// ─────────────────────────────────────────────────────────────
exports.getPatients = asyncHandler(async (req, res) => {
  const { search, gender, bloodGroup, page = 1, limit = 20 } = req.query;
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { patientId: { [Op.like]: `%${search}%` } },
      { nic: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }

  if (gender) where.gender = gender;
  if (bloodGroup) where.bloodGroup = bloodGroup;

  const offset = (Number(page) - 1) * Number(limit);
  const { rows: patients, count: total } = await Patient.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    offset,
    limit: Number(limit),
  });

  res.status(200).json({
    success: true,
    data: {
      patients,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit)
    }
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Update patient record
// @route   PUT /api/v1/patients/:id
// ─────────────────────────────────────────────────────────────
exports.updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByPk(req.params.id);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

  await patient.update(req.body);

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'UPDATE_PATIENT',
    module: 'patients',
    description: `Updated details for ${patient.patientId}`,
    targetId: patient.id,
    ipAddress: req.ip
  });

  res.status(200).json({ success: true, data: patient });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get patient full history
// @route   GET /api/v1/patients/:id/history
// ─────────────────────────────────────────────────────────────
exports.getPatientFullHistory = asyncHandler(async (req, res) => {
  const Vitals = require('../models/Vitals');
  const EMR = require('../models/EMR');
  const id = req.params.id;

  const [patient, emr, appointments, vitals] = await Promise.all([
    Patient.findByPk(id),
    EMR.findAll({
      where: { patientId: id },
      include: [{ model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] }],
      order: [['visitDate', 'DESC']],
    }),
    Appointment.findAll({
      where: { patientId: id },
      include: [{ model: User, as: 'doctor', attributes: ['id', 'name'] }],
      order: [['date', 'DESC']],
    }),
    Vitals.findAll({
      where: { patientId: id },
      order: [['createdAt', 'DESC']],
    }),
  ]);

  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

  res.status(200).json({
    success: true,
    data: { patient, emr, appointments, vitals }
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get single patient by ID
// @route   GET /api/v1/patients/:id
// ─────────────────────────────────────────────────────────────
exports.getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findByPk(req.params.id);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
  res.status(200).json({ success: true, data: patient });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get today's patient registration stats (for Receptionist dashboard)
// @route   GET /api/v1/patients/stats/today
// ─────────────────────────────────────────────────────────────
exports.getTodayPatientStats = asyncHandler(async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [todayRegistrations, totalPatients] = await Promise.all([
    Patient.count({ where: { createdAt: { [Op.between]: [todayStart, todayEnd] } } }),
    Patient.count(),
  ]);

  res.status(200).json({
    success: true,
    data: { todayRegistrations, totalPatients }
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get patient stats (for logged-in patient dashboard)
// @route   GET /api/v1/patients/my/stats
// ─────────────────────────────────────────────────────────────
exports.getPatientStats = asyncHandler(async (req, res) => {
  const EMR = require('../models/EMR');
  const patient = await Patient.findOne({ where: { userId: req.user.id } });
  if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

  const [upcomingAppointments, medicalRecordsCount] = await Promise.all([
    Appointment.count({
      where: {
        patientId: patient.id,
        date: { [Op.gte]: new Date() },
        status: { [Op.in]: ['booked', 'confirmed'] },
      },
    }),
    EMR.count({ where: { patientId: patient.id } }),
  ]);

  res.status(200).json({ success: true, data: { upcomingAppointments, medicalRecords: medicalRecordsCount } });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get patient's medical history (for logged-in patient)
// @route   GET /api/v1/patients/my/history
// ─────────────────────────────────────────────────────────────
exports.getMyMedicalHistory = asyncHandler(async (req, res) => {
  const EMR = require('../models/EMR');
  const patient = await Patient.findOne({ where: { userId: req.user.id } });
  if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

  const history = await EMR.findAll({
    where: { patientId: patient.id },
    include: [{ model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] }],
    order: [['visitDate', 'DESC']],
  });

  res.status(200).json({ success: true, data: history });
});

// ─────────────────────────────────────────────────────────────
// @desc    Get own Patient profile (for logged-in patient)
// @route   GET /api/v1/patients/me
// @access  Private/Patient
// ─────────────────────────────────────────────────────────────
exports.getMyProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ where: { userId: req.user.id } });
  if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });
  res.status(200).json({ success: true, data: patient });
});

// ─────────────────────────────────────────────────────────────
// @desc    Update own Patient profile (for logged-in patient)
// @route   PUT /api/v1/patients/me
// @access  Private/Patient
// ─────────────────────────────────────────────────────────────
exports.updateMyProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ where: { userId: req.user.id } });
  if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });

  // Only allow self-editing safe fields — not patientId, userId, registeredBy
  const allowedFields = ['phone', 'address', 'guardian', 'allergies', 'chronicConditions', 'bloodGroup', 'gender', 'dateOfBirth'];
  const updates = {};
  allowedFields.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  await patient.update(updates);

  // Also sync user's phone if provided
  if (updates.phone) {
    const User = require('../models/User');
    await User.update({ phone: updates.phone }, { where: { id: req.user.id } });
  }

  res.status(200).json({ success: true, message: 'Profile updated successfully', data: patient });
});

