// ================================================================
// ACTIVITY LOG MODEL — MySQL/Sequelize (replaces Mongoose)
// ================================================================

/* ── COMMENTED OUT: Mongoose ActivityLog Schema ──────────────────
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userRole: String,
    action: {
      type: String,
      required: true,
      uppercase: true,
    },
    module: String,
    description: String,
    targetId: mongoose.Schema.Types.ObjectId,
    ipAddress: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
─────────────────────────────────────────────── END MONGOOSE */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const ActivityLog = sequelize.define('ActivityLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  userRole: { type: DataTypes.STRING, allowNull: true },
  action: { 
    type: DataTypes.STRING, 
    allowNull: false,
    set(val) {
      this.setDataValue('action', val ? val.toUpperCase() : null);
    }
  },
  module: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.STRING, allowNull: true },
  targetId: { type: DataTypes.INTEGER, allowNull: true },
  ipAddress: { type: DataTypes.STRING, allowNull: true },
}, { 
  tableName: 'activity_logs', 
  timestamps: true,
  updatedAt: false // Only createdAt
});

module.exports = ActivityLog;
