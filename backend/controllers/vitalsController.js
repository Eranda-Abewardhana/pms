const { Op } = require('sequelize');
const Vitals = require('../models/Vitals');
const Patient = require('../models/Patient');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');

exports.recordVitals = asyncHandler(async (req, res) => {
  const { patient, appointment, temperature, bloodPressure, pulse, respiratoryRate, oxygenSaturation, weight, height, notes } = req.body;

  const vitals = await Vitals.create({
    patientId: patient,
    nurseId: req.user.id,
    appointmentId: appointment || null,
    temperature,
    bloodPressure,
    pulse,
    respiratoryRate,
    oxygenSaturation,
    weight,
    height,
    notes,
  });

  const populated = await Vitals.findByPk(vitals.id, {
    include: [
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      },
      { model: User, as: 'nurse', attributes: ['id', 'name'] },
    ],
  });

  res.status(201).json({ success: true, message: 'Vitals recorded', data: { vitals: populated }, error: null });
});

exports.getVitalsByPatient = asyncHandler(async (req, res) => {
  if (req.user.role === 'patient') {
    const profile = await Patient.findOne({ where: { userId: req.user.id } });
    if (!profile || profile.id !== Number(req.params.patientId)) {
      return res.status(403).json({ success: false, message: 'Access denied', data: null, error: 'Forbidden' });
    }
  }

  const records = await Vitals.findAll({
    where: { patientId: req.params.patientId },
    include: [
      { model: User, as: 'nurse', attributes: ['id', 'name'] },
      { model: Appointment, as: 'appointment', attributes: ['id', 'appointmentId', 'date'] },
    ],
    order: [['recordedAt', 'DESC']],
  });

  res.status(200).json({ success: true, message: 'Vitals fetched', data: { records }, error: null });
});

exports.getVitalsByAppointment = asyncHandler(async (req, res) => {
  const vitals = await Vitals.findOne({
    where: { appointmentId: req.params.appointmentId },
    include: [
      { model: User, as: 'nurse', attributes: ['id', 'name'] },
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      },
    ],
  });
  res.status(200).json({ success: true, message: 'Vitals fetched', data: { vitals: vitals || null }, error: null });
});

exports.updateVitals = asyncHandler(async (req, res) => {
  const vitals = await Vitals.findByPk(req.params.id);
  if (!vitals) return res.status(404).json({ success: false, message: 'Vitals not found', data: null, error: 'Not found' });
  await vitals.update(req.body);
  res.status(200).json({ success: true, message: 'Vitals updated', data: { vitals }, error: null });
});

exports.getNurseStats = asyncHandler(async (req, res) => {
  const LabTest = require('../models/LabTest');
  const nurseId = req.user.id;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [vitalsToday, labRequests, queueCount, recentVitals] = await Promise.all([
    Vitals.count({
      where: {
        nurseId,
        recordedAt: { [Op.gte]: today, [Op.lt]: tomorrow },
      },
    }),
    LabTest.count({
      where: {
        requestedBy: nurseId,
        createdAt: { [Op.gte]: today, [Op.lt]: tomorrow },
      },
    }),
    Appointment.count({
      where: {
        date: { [Op.gte]: today, [Op.lt]: tomorrow },
        status: { [Op.in]: ['scheduled', 'waiting', 'booked', 'confirmed'] },
      },
    }),
    Vitals.findAll({
      where: { nurseId },
      include: [
        {
          model: Patient,
          as: 'patient',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
        },
      ],
      order: [['recordedAt', 'DESC']],
      limit: 5,
    }),
  ]);

  // Count distinct patients for this nurse
  const patientRows = await Vitals.findAll({
    where: { nurseId },
    attributes: ['patientId'],
    group: ['patientId'],
  });

  res.status(200).json({
    success: true,
    message: 'Nurse stats fetched',
    data: {
      vitalsToday,
      totalPatients: patientRows.length,
      queueCount,
      labRequests,
      recentVitals,
    },
    error: null,
  });
});

exports.getVitalsHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, startDate, endDate } = req.query;
  const where = { nurseId: req.user.id };

  if (startDate && endDate) {
    where.recordedAt = { [Op.gte]: new Date(startDate), [Op.lte]: new Date(endDate) };
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { rows: records, count: total } = await Vitals.findAndCountAll({
    where,
    include: [
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      },
      { model: Appointment, as: 'appointment', attributes: ['id', 'appointmentId', 'date'] },
    ],
    order: [['recordedAt', 'DESC']],
    offset,
    limit: Number(limit),
  });

  res.status(200).json({
    success: true,
    message: 'Vitals history fetched',
    data: { records, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    error: null,
  });
});

exports.getDailyVitalsReport = asyncHandler(async (req, res) => {
  const sequelize = require('../config/sequelize');
  const { days = 7 } = req.query;
  const since = new Date();
  since.setDate(since.getDate() - Number(days));
  since.setHours(0, 0, 0, 0);

  const data = await Vitals.findAll({
    where: {
      nurseId: req.user.id,
      recordedAt: { [Op.gte]: since },
    },
    attributes: [
      [sequelize.fn('DATE', sequelize.col('recordedAt')), 'date'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: [sequelize.fn('DATE', sequelize.col('recordedAt'))],
    order: [[sequelize.fn('DATE', sequelize.col('recordedAt')), 'ASC']],
    raw: true,
  });

  res.status(200).json({ success: true, data, error: null });
});
