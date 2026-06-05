const mongoose = require('mongoose');
const { Schema } = mongoose;

const labReportSchema = new Schema(
  {
    reportId: {
      type: String,
      unique: true,
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    medicalRecordId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicalRecord',
      default: null,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    testName: {
      type: String,
      required: true,
    },
    testCategory: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    requestedDate: {
      type: Date,
      default: Date.now,
    },
    completedDate: Date,
    results: [
      {
        parameter: String,
        value: String,
        unit: String,
        referenceRange: String,
        status: String,
      },
    ],
    reportFileUrl: String,
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('LabReport', labReportSchema);
