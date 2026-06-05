const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetPassword,
  getDoctors,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Publicly available (or at least for registration/booking)
router.get('/doctors', getDoctors);

// All other routes protected
router.use(protect);

// Admin only routes for user management
router.use(authorize('admin'));

router.route('/').get(getUsers).post(createUser);

router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);

router.patch('/:id/toggle-status', toggleUserStatus);
router.patch('/:id/reset-password', resetPassword);

module.exports = router;

