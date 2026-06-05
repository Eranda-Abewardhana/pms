const ActivityLog = require('../models/ActivityLog');

/**
 * @description Logs a user action to the ActivityLog collection.
 * Non-blocking — errors are silently caught so they never interrupt the main flow.
 *
 * @param {Object} params
 * @param {string} params.userId      - The acting user's MongoDB ObjectId
 * @param {string} params.userRole    - The acting user's role
 * @param {string} params.action      - Action label (e.g. 'LOGIN', 'CREATE_USER')
 * @param {string} params.module      - The module name (e.g. 'auth', 'patients')
 * @param {string} params.description - Human-readable description
 * @param {string} [params.targetId]  - ObjectId of the record being acted upon
 * @param {string} params.ipAddress   - Request IP address
 */
const logActivity = async ({ userId, userRole, action, module, description, targetId, ipAddress }) => {
  try {
    await ActivityLog.create({ 
      userId, 
      userRole, 
      action, 
      module, 
      description, 
      targetId, 
      ipAddress 
    });
  } catch (err) {
    // Swallow logging errors — don't crash the app
    console.error(`[ActivityLog] Failed to log action "${action}":`, err.message);
  }
};

module.exports = logActivity;
