const express = require('express');
const {
  submitFeedback,
  getAllFeedback,
  getMyFeedbacks,
  togglePublishFeedback,
  getPublicFeedbacks
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Publicly viewable feedbacks (testimonials)
router.get('/public', getPublicFeedbacks);

// Protected routes
router.use(protect);

router.post('/', authorize('patient'), submitFeedback);
router.get('/my', authorize('patient'), getMyFeedbacks);
router.get('/', authorize('admin'), getAllFeedback);
router.patch('/:id/publish', authorize('admin'), togglePublishFeedback);

module.exports = router;
