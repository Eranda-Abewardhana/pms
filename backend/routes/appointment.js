const express = require('express');
const {
  createAppointment,
  getAppointments,
  getMyAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getDoctorAvailability,
  getTodayAppointments,
  getDoctorStats,
  getDoctorPatients,
  updateStatus,
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All appointment routes require login

router.get('/my', authorize('patient'), getMyAppointments);
router.get('/today', authorize('doctor', 'receptionist', 'nurse', 'admin'), getTodayAppointments);
router.get('/availability', getDoctorAvailability);

// Doctor-specific aggregation routes
router.get('/doctor/stats', authorize('doctor'), getDoctorStats);
router.get('/doctor/patients', authorize('doctor'), getDoctorPatients);

router
  .route('/')
  .post(authorize('receptionist', 'patient', 'admin'), createAppointment)
  .get(authorize('receptionist', 'doctor', 'nurse', 'admin', 'cashier'), getAppointments);

router
  .route('/:id')
  .get(getAppointmentById)
  .put(authorize('receptionist', 'admin'), updateAppointment);

router.patch('/:id/cancel', cancelAppointment);
router.patch('/:id/status', authorize('doctor', 'receptionist', 'nurse', 'admin'), updateStatus);

module.exports = router;


