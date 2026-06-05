const express = require('express');
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  processPayment,
  getMyInvoices,
  updateInvoice,
  getCashierStats,
  getWeeklyIncome,
  getTransactionAnalytics,
  getDailyIncome,
  verifyPatientPayments,
} = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Patient-specific
router.get('/my', authorize('patient'), getMyInvoices);

// Cashier/Admin analytics & stats (must be before /:id)
router.get('/stats', authorize('cashier', 'admin'), getCashierStats);
router.get('/weekly', authorize('cashier', 'admin'), getWeeklyIncome);
router.get('/analytics', authorize('cashier', 'admin'), getTransactionAnalytics);
router.get('/daily-summary', authorize('cashier', 'admin'), getDailyIncome);
router.get('/verify/:patientId', authorize('cashier', 'admin'), verifyPatientPayments);

// Core CRUD
router
  .route('/')
  .get(authorize('cashier', 'admin'), getInvoices)
  .post(authorize('cashier', 'admin'), createInvoice);

router
  .route('/:id')
  .get(authorize('cashier', 'patient', 'admin'), getInvoiceById)
  .put(authorize('cashier', 'admin'), updateInvoice);

router.post('/:id/pay', authorize('cashier', 'patient', 'admin'), processPayment);

module.exports = router;
