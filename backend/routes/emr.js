const express = require('express');
const {
  createEMR,
  getEMRByPatient,
  getEMRById,
  updateEMR,
  getEMRByAppointment
} = require('../controllers/emrController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .post(authorize('doctor'), createEMR);

router.get('/patient/:patientId', authorize('doctor', 'nurse', 'patient', 'admin'), getEMRByPatient);
router.get('/appointment/:appointmentId', authorize('doctor', 'nurse', 'admin'), getEMRByAppointment);

router
  .route('/:id')
  .get(authorize('doctor', 'nurse', 'patient', 'admin'), getEMRById)
  .put(authorize('doctor'), updateEMR);

module.exports = router;
