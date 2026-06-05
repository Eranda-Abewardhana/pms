const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const EMR = require('../models/EMR');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// @desc    Register a new patient (by Receptionist/Admin)
// @route   POST /api/v1/patients
exports.registerPatient = asyncHandler(async (req, res) => {
  const {
    name, email, phone, nic, dateOfBirth, gender, 
    bloodGroup, address, guardian, allergies, chronicConditions
  } = req.body;

  // 1. Duplicate checking (NIC is the primary unique identifier for healthcare in SL)
  if (nic) {
    const existingByNic = await Patient.findOne({ nic });
    if (existingByNic) {
      return res.status(400).json({ success: false, message: `Patient with NIC ${nic} already exists (${existingByNic.patientId})` });
    }
  }

  if (email) {
    const existingByEmail = await Patient.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({ success: false, message: 'A patient with this email already exists' });
    }
  }

  // 2. Generate unique Patient ID
  const count = await Patient.countDocuments();
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
    targetId: patient._id,
    ipAddress: req.ip 
  });

  res.status(201).json({ success: true, data: patient });
});

// @desc    Get all patients with search/filtering
// @route   GET /api/v1/patients
exports.getPatients = asyncHandler(async (req, res) => {
  const { search, gender, bloodGroup, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { patientId: { $regex: search, $options: 'i' } },
      { nic: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  if (gender) filter.gender = gender;
  if (bloodGroup) filter.bloodGroup = bloodGroup;

  const skip = (Number(page) - 1) * Number(limit);
  const [patients, total] = await Promise.all([
    Patient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Patient.countDocuments(filter)
  ]);

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

// @desc    Update patient record
// @route   PUT /api/v1/patients/:id
exports.updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'UPDATE_PATIENT',
    module: 'patients',
    description: `Updated details for ${patient.patientId}`,
    targetId: patient._id,
    ipAddress: req.ip
  });

  res.status(200).json({ success: true, data: patient });
});

// @desc    Get patient detailed history (for Doctors/Nurses)
// @route   GET /api/v1/patients/:id/history
exports.getPatientFullHistory = asyncHandler(async (req, res) => {
  const [patient, emr, appointments, vitals] = await Promise.all([
    Patient.findById(req.params.id),
    EMR.find({ patientId: req.params.id }).populate('doctorId', 'name specialization').sort({ visitDate: -1 }),
    Appointment.find({ patientId: req.params.id }).populate('doctorId', 'name').sort({ date: -1 }),
    // Vitals are usually inside EMR or separate. If separate:
    require('../models/Vitals').find({ patient: req.params.id }).sort({ createdAt: -1 })
  ]);

  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

  res.status(200).json({
    success: true,
    data: { patient, emr, appointments, vitals }
  });
});

// Existing helper methods
exports.getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });
  res.status(200).json({ success: true, data: patient });
});

// @desc    Get today's patient registration stats (for Receptionist dashboard)
// @route   GET /api/v1/patients/stats/today
exports.getTodayPatientStats = asyncHandler(async (req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [todayRegistrations, totalPatients] = await Promise.all([
    Patient.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
    Patient.countDocuments({})
  ]);

  res.status(200).json({
    success: true,
    data: { todayRegistrations, totalPatients }
  });
});

exports.getPatientStats = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });
  const upcomingAppointments = await Appointment.countDocuments({ patientId: patient._id, date: { $gte: new Date() }, status: { $in: ['booked', 'confirmed'] } });
  const medicalRecordsCount = await EMR.countDocuments({ patientId: patient._id });
  res.status(200).json({ success: true, data: { upcomingAppointments, medicalRecords: medicalRecordsCount } });
});

exports.getMyMedicalHistory = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });
  const history = await EMR.find({ patientId: patient._id }).populate('doctorId', 'name specialization').sort({ visitDate: -1 });
  res.status(200).json({ success: true, data: history });
});

// @desc    Get own Patient profile (for logged-in patient)
// @route   GET /api/v1/patients/me
// @access  Private/Patient
exports.getMyProfile = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user.id });
  if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' });
  res.status(200).json({ success: true, data: patient });
});

