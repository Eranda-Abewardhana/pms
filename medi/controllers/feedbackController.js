const Feedback = require('../models/Feedback');
const Patient = require('../models/Patient');
const asyncHandler = require('../utils/asyncHandler');
const { v4: uuidv4 } = require('uuid');

exports.submitFeedback = asyncHandler(async (req, res) => {
  const { appointmentId, doctorId, overallRating, doctorRating, serviceRating, waitTimeRating, comment } = req.body;
  
  const patientProfile = await Patient.findOne({ userId: req.user.id });
  if (!patientProfile) {
    return res.status(404).json({ success: false, message: 'Patient profile not found' });
  }

  const feedback = await Feedback.create({
    feedbackId: `FB-${uuidv4().substring(0, 8).toUpperCase()}`,
    patientId: patientProfile._id,
    appointmentId,
    doctorId,
    overallRating,
    doctorRating,
    serviceRating,
    waitTimeRating,
    comment
  });

  res.status(201).json({ success: true, message: 'Feedback submitted successfully', data: { feedback } });
});

exports.getMyFeedbacks = asyncHandler(async (req, res) => {
  const patientProfile = await Patient.findOne({ userId: req.user.id });
  if (!patientProfile) {
    return res.status(404).json({ success: false, message: 'Patient profile not found' });
  }
  const feedbacks = await Feedback.find({ patientId: patientProfile._id })
    .populate('doctorId', 'name specialization')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { feedbacks } });
});

exports.getAllFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find()
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .populate('doctorId', 'name')
    .sort({ createdAt: -1 });
    
  res.status(200).json({ success: true, data: { feedback } });
});

exports.togglePublishFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });

  feedback.isPublished = !feedback.isPublished;
  await feedback.save();

  res.status(200).json({ success: true, message: `Feedback ${feedback.isPublished ? 'published' : 'hidden'}`, data: { feedback } });
});

exports.getPublicFeedbacks = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find({ isPublished: true })
    .populate({ path: 'patientId', populate: { path: 'userId', select: 'name' } })
    .sort({ createdAt: -1 })
    .limit(10);
    
  res.status(200).json({ success: true, data: { feedbacks } });
});
