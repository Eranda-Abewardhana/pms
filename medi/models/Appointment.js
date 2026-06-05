const mongoose = require('mongoose');
const { Schema } = mongoose;

const appointmentSchema = new Schema(
  {
    appointmentId: {
      type: String,
      unique: true,
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    timeSlot: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['OPD', 'Channelized'],
      default: 'OPD',
    },
    status: {
      type: String,
      enum: ['booked', 'confirmed', 'arrived', 'in-consultation', 'completed', 'cancelled', 'no-show'],
      default: 'booked',
    },
    reason: String,
    bookedBy: {
      type: String,
      enum: ['patient', 'receptionist', 'admin'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partially_paid'],
      default: 'pending',
    },
    queueNumber: Number,
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
