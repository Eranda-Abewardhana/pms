const { Op } = require('sequelize');
const EMR = require('../models/EMR');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');

// @route   POST /api/v1/emr
exports.createEMR = asyncHandler(async (req, res) => {
  const { patient, appointment, diagnosis, icdCode, prescriptions, treatmentNotes, followUpDate, followUpNotes, isFinalized } = req.body;

  const existing = await EMR.findOne({ where: { appointmentId: appointment } });
  if (existing) {
    return res.status(400).json({ success: false, message: 'EMR already exists for this appointment', data: null, error: 'Duplicate' });
  }

  const emr = await EMR.create({
    patientId: patient,
    doctorId: req.user.id,
    appointmentId: appointment,
    diagnosis,
    icdCode,
    prescriptions: prescriptions || [],
    treatmentNotes,
    followUpDate,
    followUpNotes,
    isFinalized: isFinalized || false,
  });

  // Re-fetch with associations
  const populated = await EMR.findByPk(emr.id, {
    include: [
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      },
      { model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
    ],
  });

  res.status(201).json({ success: true, message: 'EMR created', data: { emr: populated }, error: null });
});

// @route   GET /api/v1/emr/patient/:patientId
exports.getEMRByPatient = asyncHandler(async (req, res) => {
  if (req.user.role === 'patient') {
    const profile = await Patient.findOne({ where: { userId: req.user.id } });
    if (!profile || profile.id !== Number(req.params.patientId)) {
      return res.status(403).json({ success: false, message: 'Access denied', data: null, error: 'Forbidden' });
    }
  }

  const records = await EMR.findAll({
    where: { patientId: req.params.patientId },
    include: [
      { model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
      { model: Appointment, as: 'appointment', attributes: ['id', 'appointmentId', 'date', 'timeSlot'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({ success: true, message: 'EMR records fetched', data: { records }, error: null });
});

// @route   GET /api/v1/emr/:id
exports.getEMRById = asyncHandler(async (req, res) => {
  const emr = await EMR.findByPk(req.params.id, {
    include: [
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      },
      { model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
      { model: Appointment, as: 'appointment', attributes: ['id', 'appointmentId', 'date', 'timeSlot', 'status'] },
    ],
  });
  if (!emr) return res.status(404).json({ success: false, message: 'EMR not found', data: null, error: 'Not found' });
  res.status(200).json({ success: true, message: 'EMR fetched', data: { emr }, error: null });
});

// @route   PUT /api/v1/emr/:id
exports.updateEMR = asyncHandler(async (req, res) => {
  const emr = await EMR.findByPk(req.params.id);
  if (!emr) return res.status(404).json({ success: false, message: 'EMR not found', data: null, error: 'Not found' });
  if (emr.isFinalized) return res.status(400).json({ success: false, message: 'Finalized EMR cannot be edited', data: null, error: 'Finalized' });
  if (emr.doctorId !== Number(req.user.id)) return res.status(403).json({ success: false, message: 'Not your EMR', data: null, error: 'Forbidden' });

  const fields = ['diagnosis', 'icdCode', 'prescriptions', 'treatmentNotes', 'followUpDate', 'followUpNotes', 'isFinalized'];
  const updates = {};
  fields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  await emr.update(updates);
  res.status(200).json({ success: true, message: 'EMR updated', data: { emr }, error: null });
});

// @route   GET /api/v1/emr/appointment/:appointmentId
exports.getEMRByAppointment = asyncHandler(async (req, res) => {
  const emr = await EMR.findOne({
    where: { appointmentId: req.params.appointmentId },
    include: [
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      },
      { model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
    ],
  });
  res.status(200).json({ success: true, message: 'EMR fetched', data: { emr: emr || null }, error: null });
});
