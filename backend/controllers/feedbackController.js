const Feedback = require('../models/Feedback');
const Patient = require('../models/Patient');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { v4: uuidv4 } = require('uuid');

exports.submitFeedback = asyncHandler(async (req, res) => {
  const { appointmentId, doctorId, overallRating, doctorRating, serviceRating, waitTimeRating, comment } = req.body;
  
  const patientProfile = await Patient.findOne({ where: { userId: req.user.id } });
  if (!patientProfile) {
    return res.status(404).json({ success: false, message: 'Patient profile not found' });
  }

  const feedback = await Feedback.create({
    feedbackId: `FB-${uuidv4().substring(0, 8).toUpperCase()}`,
    patientId: patientProfile.id,
    appointmentId: appointmentId || null,
    doctorId: doctorId || null,
    overallRating,
    doctorRating,
    serviceRating,
    waitTimeRating,
    comment
  });

  res.status(201).json({ success: true, message: 'Feedback submitted successfully', data: { feedback } });
});

exports.getMyFeedbacks = asyncHandler(async (req, res) => {
  const patientProfile = await Patient.findOne({ where: { userId: req.user.id } });
  if (!patientProfile) {
    return res.status(404).json({ success: false, message: 'Patient profile not found' });
  }
  const feedbacks = await Feedback.findAll({ 
    where: { patientId: patientProfile.id },
    include: [{ model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] }],
    order: [['createdAt', 'DESC']]
  });
  res.status(200).json({ success: true, data: { feedbacks } });
});

exports.getAllFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findAll({
    include: [
      { 
        model: Patient, 
        as: 'patient', 
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] 
      },
      { model: User, as: 'doctor', attributes: ['id', 'name'] }
    ],
    order: [['createdAt', 'DESC']]
  });
    
  res.status(200).json({ success: true, data: { feedback } });
});

exports.togglePublishFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findByPk(req.params.id);
  if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });

  feedback.isPublished = !feedback.isPublished;
  await feedback.save();

  res.status(200).json({ success: true, message: `Feedback ${feedback.isPublished ? 'published' : 'hidden'}`, data: { feedback } });
});

exports.getPublicFeedbacks = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.findAll({ 
    where: { isPublished: true },
    include: [
      { 
        model: Patient, 
        as: 'patient', 
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] 
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: 10
  });
    
  res.status(200).json({ success: true, data: { feedbacks } });
});
