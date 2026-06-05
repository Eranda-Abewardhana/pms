const express = require('express');
const {
  createLabRequest,
  getLabTests,
  getLabTestById,
  updateTestResult,
  getMyLabResults,
  getPendingTests,
  getDoctorLabReports,
  getLabStats,
} = require('../controllers/labController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/stats', authorize('labtech', 'admin'), getLabStats);
router.get('/my-results', authorize('patient'), getMyLabResults);
router.get('/pending', authorize('labtech', 'admin', 'cashier'), getPendingTests);
router.get('/doctor/reports', authorize('doctor'), getDoctorLabReports);

router
  .route('/')
  .get(authorize('labtech', 'doctor', 'nurse', 'admin', 'cashier'), getLabTests)
  .post(authorize('doctor', 'nurse', 'admin'), createLabRequest);

router
  .route('/:id')
  .get(authorize('labtech', 'doctor', 'patient', 'admin', 'cashier'), getLabTestById)
  .put(authorize('labtech', 'admin'), updateTestResult);

module.exports = router;
