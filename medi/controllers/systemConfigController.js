const SystemConfig = require('../models/SystemConfig');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// @desc    Get system configuration
// @route   GET /api/v1/config
// @access  Private/Admin
exports.getConfig = asyncHandler(async (req, res) => {
  let config = await SystemConfig.findOne();
  
  if (!config) {
    config = await SystemConfig.create({});
  }

  res.status(200).json({
    success: true,
    data: config
  });
});

// @desc    Update system configuration
// @route   PUT /api/v1/config
// @access  Private/Admin
exports.updateConfig = asyncHandler(async (req, res) => {
  let config = await SystemConfig.findOne();
  
  if (!config) {
    config = new SystemConfig();
  }

  const fields = [
    'clinicName', 'contactEmail', 'contactPhone', 'address', 
    'currency', 'languages', 'notifications', 'appointmentInterval', 'mfaRequired'
  ];

  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      config[field] = req.body[field];
    }
  });

  config.updatedBy = req.user.id;
  await config.save();

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'UPDATE_CONFIG',
    module: 'system',
    description: 'Updated system configuration',
    ipAddress: req.ip
  });

  res.status(200).json({
    success: true,
    data: config
  });
});
