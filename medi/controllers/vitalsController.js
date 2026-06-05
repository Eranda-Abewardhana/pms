const Vitals = require('../models/Vitals');
const Patient = require('../models/Patient');
const asyncHandler = require('../utils/asyncHandler');

exports.recordVitals = asyncHandler(async (req, res) => {
  const { patient, appointment, temperature, bloodPressure, pulse, respiratoryRate, oxygenSaturation, weight, height, notes } = req.body;
  
  const vitals = await Vitals.create({
    patient, 
    nurse: req.user.id, 
    appointment, 
    temperature, 
    bloodPressure, 
    pulse,
    respiratoryRate, 
    oxygenSaturation, 
    weight, 
    height, 
    notes,
  });

  await vitals.populate([
    { path: 'patient', populate: { path: 'userId', select: 'name' } },
    { path: 'nurse', select: 'name' },
  ]);

  res.status(201).json({ success: true, message: 'Vitals recorded', data: { vitals }, error: null });
});

exports.getVitalsByPatient = asyncHandler(async (req, res) => {
  if (req.user.role === 'patient') {
    const profile = await Patient.findOne({ userId: req.user.id });
    if (!profile || profile._id.toString() !== req.params.patientId) {
      return res.status(403).json({ success: false, message: 'Access denied', data: null, error: 'Forbidden' });
    }
  }
  const records = await Vitals.find({ patient: req.params.patientId })
    .populate('nurse', 'name')
    .populate('appointment', 'appointmentId date')
    .sort({ recordedAt: -1 });
  res.status(200).json({ success: true, message: 'Vitals fetched', data: { records }, error: null });
});

exports.getVitalsByAppointment = asyncHandler(async (req, res) => {
  const vitals = await Vitals.findOne({ appointment: req.params.appointmentId })
    .populate('nurse', 'name')
    .populate({ path: 'patient', populate: { path: 'userId', select: 'name' } });
  res.status(200).json({ success: true, message: 'Vitals fetched', data: { vitals: vitals || null }, error: null });
});

exports.updateVitals = asyncHandler(async (req, res) => {
  const vitals = await Vitals.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!vitals) return res.status(404).json({ success: false, message: 'Vitals not found', data: null, error: 'Not found' });
  res.status(200).json({ success: true, message: 'Vitals updated', data: { vitals }, error: null });
});

exports.getNurseStats = asyncHandler(async (req, res) => {
  const Appointment = require('../models/Appointment');
  const LabTest = require('../models/LabTest');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [vitalsToday, totalPatients, queueCount, labRequests] = await Promise.all([
    Vitals.countDocuments({ nurse: req.user.id, recordedAt: { $gte: today, $lt: tomorrow } }),
    Vitals.distinct('patient', { nurse: req.user.id }),
    Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'waiting'] },
    }),
    LabTest.countDocuments({
      requestedBy: req.user.id,
      createdAt: { $gte: today, $lt: tomorrow },
    }),
  ]);

  const recentVitals = await Vitals.find({ nurse: req.user.id })
    .populate({ path: 'patient', populate: { path: 'userId', select: 'name' } })
    .sort({ recordedAt: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    message: 'Nurse stats fetched',
    data: {
      vitalsToday,
      totalPatients: totalPatients.length,
      queueCount,
      labRequests,
      recentVitals,
    },
    error: null,
  });
});

exports.getVitalsHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, startDate, endDate } = req.query;
  const filter = { nurse: req.user.id };

  if (startDate && endDate) {
    filter.recordedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [records, total] = await Promise.all([
    Vitals.find(filter)
      .populate({ path: 'patient', populate: { path: 'userId', select: 'name' } })
      .populate('appointment', 'appointmentId date')
      .sort({ recordedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Vitals.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Vitals history fetched',
    data: { records, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    error: null,
  });
});

exports.getDailyVitalsReport = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - Number(days));
  since.setHours(0, 0, 0, 0);

  const mongoose = require('mongoose');
  const nurseId = new mongoose.Types.ObjectId(req.user.id);

  const data = await Vitals.aggregate([
    { $match: { nurse: nurseId, recordedAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$recordedAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({ success: true, data, error: null });
});
