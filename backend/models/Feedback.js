// ================================================================
// FEEDBACK MODEL — MySQL/Sequelize (replaces Mongoose)
// ================================================================

/* ── COMMENTED OUT: Mongoose Feedback Schema ─────────────────────
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
─────────────────────────────────────────────── END MONGOOSE */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Feedback = sequelize.define('Feedback', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  feedbackId: { type: DataTypes.STRING, unique: true, allowNull: false },
  patientId: { type: DataTypes.INTEGER, allowNull: false },
  appointmentId: { type: DataTypes.INTEGER, allowNull: true },
  doctorId: { type: DataTypes.INTEGER, allowNull: true },
  overallRating: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 }, allowNull: true },
  doctorRating: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 }, allowNull: true },
  serviceRating: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 }, allowNull: true },
  waitTimeRating: { type: DataTypes.INTEGER, validate: { min: 1, max: 5 }, allowNull: true },
  comment: { type: DataTypes.TEXT, allowNull: true },
  isPublished: { type: DataTypes.BOOLEAN, defaultValue: false },
  publishedAsTestimonial: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { 
  tableName: 'feedbacks', 
  timestamps: true 
});

module.exports = Feedback;
