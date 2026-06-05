const { Op } = require('sequelize');
const LabTest = require('../models/LabTest');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// @desc    Create new lab request
exports.createLabRequest = asyncHandler(async (req, res) => {
  const { patient, appointment, testType, customTestName, priority, clinicalNotes } = req.body;

  const test = await LabTest.create({
    patientId: patient,
    appointmentId: appointment || null,
    testType,
    customTestName,
    priority,
    clinicalNotes,
    requestedBy: req.user.id,
  });

  const populated = await LabTest.findByPk(test.id, {
    include: [
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      },
      { model: User, as: 'requestedByUser', attributes: ['id', 'name'] },
    ],
  });

  res.status(201).json({ success: true, message: 'Lab test requested', data: { test: populated }, error: null });
});

// @desc    Get all lab tests
exports.getLabTests = asyncHandler(async (req, res) => {
  const { status, patient, priority, page = 1, limit = 20 } = req.query;
  const where = {};

  if (status) {
    const statuses = status.split(',').map((s) => s.trim());
    where.status = statuses.length > 1 ? { [Op.in]: statuses } : statuses[0];
  }
  if (patient) where.patientId = patient;
  if (priority) where.priority = priority;

  // Doctors only see what they requested
  if (req.user.role === 'doctor') where.requestedBy = req.user.id;

  const offset = (Number(page) - 1) * Number(limit);
  const { rows: tests, count: total } = await LabTest.findAndCountAll({
    where,
    include: [
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      },
      { model: User, as: 'requestedByUser', attributes: ['id', 'name'] },
      { model: User, as: 'assignedToUser', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
    offset,
    limit: Number(limit),
  });

  res.status(200).json({
    success: true,
    message: 'Lab tests fetched',
    data: { tests, total, page: Number(page), totalPages: Math.ceil(total / limit) },
    error: null,
  });
});

// @desc    Get single lab test
exports.getLabTestById = asyncHandler(async (req, res) => {
  const test = await LabTest.findByPk(req.params.id, {
    include: [
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
      },
      { model: User, as: 'requestedByUser', attributes: ['id', 'name', 'specialization'] },
      { model: User, as: 'assignedToUser', attributes: ['id', 'name'] },
      { model: Appointment, as: 'appointment', attributes: ['id', 'appointmentId', 'date'] },
    ],
  });
  if (!test) return res.status(404).json({ success: false, message: 'Lab test not found', data: null, error: 'Not found' });
  res.status(200).json({ success: true, message: 'Lab test fetched', data: { test }, error: null });
});

// @desc    Update test result / status
exports.updateTestResult = asyncHandler(async (req, res) => {
  const { results, resultSummary, isAbnormal, status } = req.body;
  const test = await LabTest.findByPk(req.params.id);
  if (!test) return res.status(404).json({ success: false, message: 'Lab test not found', data: null, error: 'Not found' });

  const updates = {};
  if (results !== undefined) updates.results = results;
  if (resultSummary !== undefined) updates.resultSummary = resultSummary;
  if (isAbnormal !== undefined) updates.isAbnormal = isAbnormal;
  if (status !== undefined) updates.status = status;

  if (status === 'in-progress' && !test.assignedTo) {
    updates.assignedTo = req.user.id;
  }

  await test.update(updates);

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'UPDATE_LAB_RESULT',
    module: 'laboratory',
    description: `Updated test ${test.testId} to status ${status || test.status}`,
    targetId: test.id,
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: 'Test result updated', data: { test }, error: null });
});

// @desc    Get lab tech dashboard stats
exports.getLabStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pending, inProgress, completedToday, totalToday] = await Promise.all([
    LabTest.count({ where: { status: 'pending' } }),
    LabTest.count({ where: { status: 'in-progress' } }),
    LabTest.count({ where: { status: 'completed', completedAt: { [Op.gte]: today } } }),
    LabTest.count({ where: { createdAt: { [Op.gte]: today } } }),
  ]);

  res.status(200).json({
    success: true,
    data: { pending, inProgress, completedToday, totalToday }
  });
});

// @desc    Get patient's lab results (for logged-in patient)
exports.getMyLabResults = asyncHandler(async (req, res) => {
  const profile = await Patient.findOne({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ success: false, message: 'Patient profile not found', data: null, error: 'Not found' });

  const tests = await LabTest.findAll({
    where: { patientId: profile.id },
    include: [{ model: User, as: 'requestedByUser', attributes: ['id', 'name', 'specialization'] }],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({ success: true, message: 'Lab results fetched', data: { tests }, error: null });
});

// @desc    Get pending/in-progress tests (for lab tech)
exports.getPendingTests = asyncHandler(async (req, res) => {
  const tests = await LabTest.findAll({
    where: { status: { [Op.in]: ['pending', 'in-progress'] } },
    include: [
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      },
      { model: User, as: 'requestedByUser', attributes: ['id', 'name'] },
    ],
    order: [['priority', 'ASC'], ['createdAt', 'ASC']],
  });
  res.status(200).json({ success: true, message: 'Pending tests fetched', data: { tests }, error: null });
});

// @desc    Get lab reports for a doctor (their patients)
exports.getDoctorLabReports = asyncHandler(async (req, res) => {
  const doctorId = req.user.id;

  // Get distinct patient IDs from doctor's appointments
  const patientRows = await Appointment.findAll({
    where: { doctorId },
    attributes: ['patientId'],
    group: ['patientId'],
  });
  const patientIds = patientRows.map((r) => r.patientId);

  if (!patientIds.length) {
    return res.status(200).json({ success: true, data: { tests: [], total: 0, page: 1, totalPages: 0 } });
  }

  const { status, page = 1, limit = 20 } = req.query;
  const where = { patientId: { [Op.in]: patientIds } };
  if (status) where.status = status;

  const offset = (Number(page) - 1) * Number(limit);
  const { rows: tests, count: total } = await LabTest.findAndCountAll({
    where,
    include: [
      { model: Patient, as: 'patient', attributes: ['id', 'name', 'patientId', 'gender', 'bloodGroup'] },
      { model: User, as: 'requestedByUser', attributes: ['id', 'name', 'specialization'] },
      { model: User, as: 'assignedToUser', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
    offset,
    limit: Number(limit),
  });

  res.status(200).json({
    success: true,
    message: 'Doctor lab reports fetched',
    data: { tests, total, page: Number(page), totalPages: Math.ceil(total / limit) },
    error: null,
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Upload a PDF/image report file for a lab test
// @route   POST /api/v1/lab/upload  (body: { testId } + file)
// @access  Private/Labtech/Admin
// ─────────────────────────────────────────────────────────────
exports.uploadLabReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const { testId } = req.body;
  if (!testId) {
    return res.status(400).json({ success: false, message: 'testId is required' });
  }

  const test = await LabTest.findByPk(testId);
  if (!test) {
    return res.status(404).json({ success: false, message: 'Lab test not found' });
  }

  await test.update({
    reportFile: req.file.filename,
    reportFileName: req.file.originalname,
  });

  res.status(200).json({
    success: true,
    message: 'Report uploaded successfully',
    data: { reportFile: req.file.filename, reportFileName: req.file.originalname },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    Download the report file for a lab test
// @route   GET /api/v1/lab/:id/report-file
// @access  Private (patient/doctor/labtech/admin)
// ─────────────────────────────────────────────────────────────
exports.downloadLabReport = asyncHandler(async (req, res) => {
  const path = require('path');
  const test = await LabTest.findByPk(req.params.id);
  if (!test || !test.reportFile) {
    return res.status(404).json({ success: false, message: 'Report file not found' });
  }
  const filePath = path.join(__dirname, '../uploads/lab-reports', test.reportFile);
  res.download(filePath, test.reportFileName || test.reportFile);
});

