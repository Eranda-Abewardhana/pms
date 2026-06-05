const express = require('express');
const {
  getDashboardStats,
  getDashboardDoctors,
  getActivityChart,
  getRecentAppointments,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
  getAllPatients,
  getAllFeedback,
  getSystemConfig,
  updateSystemConfig,
  getRevenueReport,
  getAppointmentReport,
  getLabReport,
  getActivityLogs,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats',                getDashboardStats);
router.get('/doctors',              getDashboardDoctors);
router.get('/activity-chart',       getActivityChart);
router.get('/recent-appointments',  getRecentAppointments);

// User Management
router.route('/users')
  .get(getAllUsers)
  .post(createUser);

router.route('/users/:id')
  .put(updateUser)
  .delete(deleteUser);

router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/reset-password', resetUserPassword);

// Patients, Feedback, Config
router.get('/patients', getAllPatients);
router.get('/feedback', getAllFeedback);

router.route('/config')
  .get(getSystemConfig)
  .put(updateSystemConfig);

// Reports
router.get('/reports/revenue', getRevenueReport);
router.get('/reports/appointments', getAppointmentReport);
router.get('/reports/lab', getLabReport);

// Activity Logs
router.get('/activity-logs', getActivityLogs);

module.exports = router;
