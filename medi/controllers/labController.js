const LabTest = require('../models/LabTest');
const Patient = require('../models/Patient');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// @desc    Create new lab request
exports.createLabRequest = asyncHandler(async (req, res) => {
  const { patient, appointment, testType, customTestName, priority, clinicalNotes } = req.body;
  const test = await LabTest.create({
    patient, appointment, testType, customTestName, priority, clinicalNotes,
    requestedBy: req.user.id,
  });
  await test.populate([
    { path: 'patient', populate: { path: 'userId', select: 'name' } },
    { path: 'requestedBy', select: 'name' },
  ]);
  res.status(201).json({ success: true, message: 'Lab test requested', data: { test }, error: null });
});

// @desc    Get all lab tests
exports.getLabTests = asyncHandler(async (req, res) => {
  const { status, patient, priority, page = 1, limit = 20 } = req.query;
  const filter = {};
  
  if (status) {
    const statuses = status.split(',').map((s) => s.trim());
    filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
  }
  
  if (patient) filter.patient = patient;
  if (priority) filter.priority = priority;
  
  // Doctors only see what they requested, Labtechs see everything pending or assigned to them
  if (req.user.role === 'doctor') filter.requestedBy = req.user.id;

  const skip = (Number(page) - 1) * Number(limit);
  const [tests, total] = await Promise.all([
    LabTest.find(filter)
      .populate({ path: 'patient', populate: { path: 'userId', select: 'name email' } })
      .populate('requestedBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    LabTest.countDocuments(filter),
  ]);
  res.status(200).json({ success: true, message: 'Lab tests fetched', data: { tests, total, page: Number(page), totalPages: Math.ceil(total / limit) }, error: null });
});

// @desc    Get single lab test
exports.getLabTestById = asyncHandler(async (req, res) => {
  const test = await LabTest.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'userId', select: 'name email phone' } })
    .populate('requestedBy', 'name specialization')
    .populate('assignedTo', 'name')
    .populate('appointment', 'appointmentId date');
  if (!test) return res.status(404).json({ success: false, message: 'Lab test not found', data: null, error: 'Not found' });
  res.status(200).json({ success: true, message: 'Lab test fetched', data: { test }, error: null });
});

// @desc    Update test result / status
exports.updateTestResult = asyncHandler(async (req, res) => {
  const { results, resultSummary, isAbnormal, status } = req.body;
  const test = await LabTest.findById(req.params.id);
  if (!test) return res.status(404).json({ success: false, message: 'Lab test not found', data: null, error: 'Not found' });

  if (results !== undefined) test.results = results;
  if (resultSummary !== undefined) test.resultSummary = resultSummary;
  if (isAbnormal !== undefined) test.isAbnormal = isAbnormal;
  if (status !== undefined) test.status = status;
  
  if (status === 'in-progress' && !test.assignedTo) {
    test.assignedTo = req.user.id;
  }

  await test.save();

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'UPDATE_LAB_RESULT',
    module: 'laboratory',
    description: `Updated test ${test.testId} to status ${test.status}`,
    targetId: test._id,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: 'Test result updated', data: { test }, error: null });
});

// @desc    Get lab tech dashboard stats
exports.getLabStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pending, inProgress, completedToday, totalToday] = await Promise.all([
    LabTest.countDocuments({ status: 'pending' }),
    LabTest.countDocuments({ status: 'in-progress' }),
    LabTest.countDocuments({ status: 'completed', completedAt: { $gte: today } }),
    LabTest.countDocuments({ createdAt: { $gte: today } }),
  ]);

  res.status(200).json({
    success: true,
    data: { pending, inProgress, completedToday, totalToday }
  });
});

// @desc    Get patient's lab results
exports.getMyLabResults = asyncHandler(async (req, res) => {
  const profile = await Patient.findOne({ userId: req.user.id });
  if (!profile) return res.status(404).json({ success: false, message: 'Patient profile not found', data: null, error: 'Not found' });

  const tests = await LabTest.find({ patient: profile._id })
    .populate('requestedBy', 'name specialization')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, message: 'Lab results fetched', data: { tests }, error: null });
});

exports.getPendingTests = asyncHandler(async (req, res) => {
  const tests = await LabTest.find({ status: { $in: ['pending', 'in-progress'] } })
    .populate({ path: 'patient', populate: { path: 'userId', select: 'name' } })
    .populate('requestedBy', 'name')
    .sort({ priority: 1, createdAt: 1 });
  res.status(200).json({ success: true, message: 'Pending tests fetched', data: { tests }, error: null });
});

exports.getDoctorLabReports = asyncHandler(async (req, res) => {
  const Appointment = require('../models/Appointment');
  const doctorId = req.user.id;
  const patientIds = await Appointment.distinct('patientId', { doctorId });

  const { status, page = 1, limit = 20 } = req.query;
  const filter = { patient: { $in: patientIds } };
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [tests, total] = await Promise.all([
    LabTest.find(filter)
      .populate({ path: 'patient', select: 'name patientId gender age bloodGroup' })
      .populate('requestedBy', 'name specialization')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    LabTest.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Doctor lab reports fetched',
    data: { tests, total, page: Number(page), totalPages: Math.ceil(total / limit) },
    error: null,
  });
});
