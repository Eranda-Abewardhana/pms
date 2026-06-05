const mongoose = require('mongoose');
const { Schema } = mongoose;

const feedbackSchema = new Schema(
  {
    feedbackId: {
      type: String,
      unique: true,
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    doctorRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    serviceRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    waitTimeRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAsTestimonial: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
