const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @description Lab test request — created by a doctor, processed by a lab technician.
 * testId is auto-generated (LT-XXXXX).
 */

const LAB_TEST_TYPES = [
  'Blood CBC',
  'Blood Sugar (Fasting)',
  'Blood Sugar (Random)',
  'Lipid Panel',
  'Liver Function Test',
  'Kidney Function Test',
  'Thyroid (TSH)',
  'Urine Full Report',
  'Urine Culture',
  'ECG',
  'Chest X-Ray',
  'Ultrasound (Abdomen)',
  'COVID-19 PCR',
  'HbA1c',
  'Other',
];

const labTestSchema = new Schema(
  {
    testId: {
      type: String,
      unique: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // doctor
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User', // lab technician
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    testType: {
      type: String,
      enum: LAB_TEST_TYPES,
      required: [true, 'Test type is required'],
    },
    customTestName: {
      type: String, // used when testType === 'Other'
      trim: true,
    },
    priority: {
      type: String,
      enum: ['routine', 'urgent', 'stat'],
      default: 'routine',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    clinicalNotes: {
      type: String,
      maxlength: 500, // doctor's notes for the lab
    },
    results: {
      type: String,
      maxlength: 3000,
    },
    resultSummary: {
      type: String,
      maxlength: 500,
    },
    isAbnormal: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ── Auto-generate testId ──────────────────────────────────────────
labTestSchema.pre('save', async function () {
  if (!this.isNew) return;
  const count = await mongoose.model('LabTest').countDocuments();
  this.testId = `LT-${String(count + 1).padStart(5, '0')}`;
});

// ── Set completedAt when status becomes completed ─────────────────
labTestSchema.pre('save', function () {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
});

labTestSchema.index({ patient: 1, createdAt: -1 });
labTestSchema.index({ status: 1 });
labTestSchema.index({ requestedBy: 1 });
labTestSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('LabTest', labTestSchema);
module.exports.LAB_TEST_TYPES = LAB_TEST_TYPES;
