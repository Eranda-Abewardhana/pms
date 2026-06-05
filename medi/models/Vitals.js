const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @description Patient vitals recorded by a nurse before/during consultation.
 * Linked to a specific appointment for full clinical context.
 */
const vitalsSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    nurse: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    temperature: {
      value: Number,   // in °C
      unit: { type: String, default: '°C' },
    },
    bloodPressure: {
      systolic: Number,   // mmHg
      diastolic: Number,  // mmHg
    },
    pulse: {
      type: Number, // beats per minute
    },
    respiratoryRate: {
      type: Number, // breaths per minute
    },
    oxygenSaturation: {
      type: Number, // SpO2 %
    },
    weight: {
      value: Number,  // kg
      unit: { type: String, default: 'kg' },
    },
    height: {
      value: Number,  // cm
      unit: { type: String, default: 'cm' },
    },
    bmi: {
      type: Number, // auto-calculated
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ── Auto-calculate BMI before save ───────────────────────────────
vitalsSchema.pre('save', function () {
  if (this.weight?.value && this.height?.value) {
    const heightM = this.height.value / 100;
    this.bmi = parseFloat((this.weight.value / (heightM * heightM)).toFixed(1));
  }
});

vitalsSchema.index({ patient: 1, recordedAt: -1 });
vitalsSchema.index({ appointment: 1 });

module.exports = mongoose.model('Vitals', vitalsSchema);
