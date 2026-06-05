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
