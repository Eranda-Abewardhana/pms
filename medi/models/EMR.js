const mongoose = require('mongoose');
const { Schema } = mongoose;

const medicalRecordSchema = new Schema(
  {
    recordId: {
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
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    visitType: String,
    chiefComplaint: String,
    diagnosis: String,
    symptoms: [String],
    vitals: {
      bloodPressure: String,
      pulse: Number,
      temperature: Number,
      weight: Number,
      height: Number,
      bmi: Number,
      oxygenSaturation: Number,
      recordedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    prescriptions: [
      {
        medicine: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
      },
    ],
    labTestsRequested: [
      {
        type: Schema.Types.ObjectId,
        ref: 'LabTest',
      },
    ],
    doctorNotes: String,
    followUpDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
