const express = require('express');
const {
  recordVitals,
  getVitalsByPatient,
  getVitalsByAppointment,
  updateVitals,
  getNurseStats,
  getVitalsHistory,
  getDailyVitalsReport,
} = require('../controllers/vitalsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Nurse-specific routes
router.get('/nurse/stats', authorize('nurse', 'admin'), getNurseStats);
router.get('/history', authorize('nurse', 'admin'), getVitalsHistory);
router.get('/report/daily', authorize('nurse', 'admin'), getDailyVitalsReport);

router.post('/', authorize('nurse', 'doctor', 'admin'), recordVitals);
router.get('/patient/:patientId', authorize('doctor', 'nurse', 'patient', 'admin'), getVitalsByPatient);
router.get('/appointment/:appointmentId', authorize('doctor', 'nurse', 'admin'), getVitalsByAppointment);
router.put('/:id', authorize('nurse', 'doctor', 'admin'), updateVitals);

module.exports = router;
