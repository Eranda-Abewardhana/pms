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
  uploadLabReport,
  downloadLabReport,
} = require('../controllers/labController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

router.get('/stats', authorize('labtech', 'admin'), getLabStats);
router.get('/my-results', authorize('patient'), getMyLabResults);
router.get('/pending', authorize('labtech', 'admin', 'cashier'), getPendingTests);
router.get('/doctor/reports', authorize('doctor'), getDoctorLabReports);

// File upload for lab report
router.post('/upload', authorize('labtech', 'admin'), upload.single('reportFile'), uploadLabReport);

router
  .route('/')
  .get(authorize('labtech', 'doctor', 'nurse', 'admin', 'cashier'), getLabTests)
  .post(authorize('doctor', 'nurse', 'admin'), createLabRequest);

router
  .route('/:id')
  .get(authorize('labtech', 'doctor', 'patient', 'admin', 'cashier'), getLabTestById)
  .put(authorize('labtech', 'admin'), updateTestResult);

// Download report file
router.get('/:id/report-file', authorize('labtech', 'doctor', 'patient', 'admin', 'nurse'), downloadLabReport);

module.exports = router;
