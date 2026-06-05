const EMR = require('../models/EMR');
const Patient = require('../models/Patient');
const asyncHandler = require('../utils/asyncHandler');

exports.createEMR = asyncHandler(async (req, res) => {
  const { patient, appointment, diagnosis, icdCode, prescriptions, treatmentNotes, followUpDate, followUpNotes, isFinalized } = req.body;

  const existing = await EMR.findOne({ appointment });
  if (existing) {
    return res.status(400).json({ success: false, message: 'EMR already exists for this appointment', data: null, error: 'Duplicate' });
  }

  const emr = await EMR.create({
    patient, doctor: req.user.id, appointment, diagnosis, icdCode,
    prescriptions: prescriptions || [], treatmentNotes, followUpDate, followUpNotes,
    isFinalized: isFinalized || false,
  });

  await emr.populate([
    { path: 'patient', populate: { path: 'userId', select: 'name' } },
    { path: 'doctor', select: 'name specialization' },
  ]);

  res.status(201).json({ success: true, message: 'EMR created', data: { emr }, error: null });
});

exports.getEMRByPatient = asyncHandler(async (req, res) => {
  if (req.user.role === 'patient') {
    const profile = await Patient.findOne({ userId: req.user.id });
    if (!profile || profile._id.toString() !== req.params.patientId) {
      return res.status(403).json({ success: false, message: 'Access denied', data: null, error: 'Forbidden' });
    }
  }
  const records = await EMR.find({ patient: req.params.patientId })
    .populate('doctor', 'name specialization')
    .populate('appointment', 'appointmentId date timeSlot')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, message: 'EMR records fetched', data: { records }, error: null });
});

exports.getEMRById = asyncHandler(async (req, res) => {
  const emr = await EMR.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'userId', select: 'name email' } })
    .populate('doctor', 'name specialization')
    .populate('appointment', 'appointmentId date timeSlot status');
  if (!emr) return res.status(404).json({ success: false, message: 'EMR not found', data: null, error: 'Not found' });
  res.status(200).json({ success: true, message: 'EMR fetched', data: { emr }, error: null });
});

exports.updateEMR = asyncHandler(async (req, res) => {
  const emr = await EMR.findById(req.params.id);
  if (!emr) return res.status(404).json({ success: false, message: 'EMR not found', data: null, error: 'Not found' });
  if (emr.isFinalized) return res.status(400).json({ success: false, message: 'Finalized EMR cannot be edited', data: null, error: 'Finalized' });
  if (emr.doctor.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not your EMR', data: null, error: 'Forbidden' });

  const fields = ['diagnosis', 'icdCode', 'prescriptions', 'treatmentNotes', 'followUpDate', 'followUpNotes', 'isFinalized'];
  fields.forEach((f) => { if (req.body[f] !== undefined) emr[f] = req.body[f]; });
  await emr.save();
  res.status(200).json({ success: true, message: 'EMR updated', data: { emr }, error: null });
});

exports.getEMRByAppointment = asyncHandler(async (req, res) => {
  const emr = await EMR.findOne({ appointment: req.params.appointmentId })
    .populate({ path: 'patient', populate: { path: 'userId', select: 'name email' } })
    .populate('doctor', 'name specialization');
  res.status(200).json({ success: true, message: 'EMR fetched', data: { emr: emr || null }, error: null });
});
