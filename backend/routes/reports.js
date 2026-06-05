const express = require('express');
const { 
  getRevenueReport, 
  getPatientStats, 
  getDiseaseTrends,
  exportRevenuePDF,
  exportRevenueExcel,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/revenue', authorize('admin', 'cashier'), getRevenueReport);
router.get('/patients', authorize('admin'), getPatientStats);
router.get('/trends', authorize('admin', 'doctor'), getDiseaseTrends);

// Export endpoints
router.get('/export/pdf', authorize('admin', 'cashier'), exportRevenuePDF);
router.get('/export/excel', authorize('admin', 'cashier'), exportRevenueExcel);

module.exports = router;
