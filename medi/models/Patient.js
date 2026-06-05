const mongoose = require('mongoose');
const { Schema } = mongoose;

const patientSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    patientId: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: String,
    phone: String,
    nic: {
      type: String,
      unique: true,
    },
    dateOfBirth: Date,
    age: Number,
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    bloodGroup: String,
    address: String,
    guardian: {
      name: String,
      relationship: String,
      phone: String,
    },
    allergies: [String],
    chronicConditions: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    registeredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
