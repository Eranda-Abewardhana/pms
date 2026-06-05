const express = require('express');
const {
  registerPatient,
  getPatients,
  getPatientById,
  getPatientStats,
  getMyMedicalHistory,
  getMyProfile,
  getTodayPatientStats
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes here require authentication
router.use(protect);

router.get('/me', authorize('patient'), getMyProfile);
router.get('/me/stats', authorize('patient'), getPatientStats);
router.get('/me/history', authorize('patient'), getMyMedicalHistory);
router.get('/stats/today', authorize('admin', 'receptionist', 'nurse', 'doctor'), getTodayPatientStats);

router
  .route('/')
  .get(authorize('admin', 'doctor', 'receptionist', 'nurse', 'cashier'), getPatients)
  .post(authorize('admin', 'receptionist'), registerPatient);

router
  .route('/:id')
  .get(authorize('admin', 'doctor', 'receptionist', 'nurse', 'cashier'), getPatientById);

module.exports = router;
