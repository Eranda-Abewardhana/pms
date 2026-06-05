const express = require('express');
const { 
  getRevenueReport, 
  getPatientStats, 
  getDiseaseTrends 
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/revenue', authorize('admin', 'cashier'), getRevenueReport);
router.get('/patients', authorize('admin'), getPatientStats);
router.get('/trends', authorize('admin', 'doctor'), getDiseaseTrends);

module.exports = router;
