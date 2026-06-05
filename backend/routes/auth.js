const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  login,
  logout,
  getMe,
  register,
  loginValidation,
  registerValidation,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ── Rate limiter: max 10 login attempts per 15 minutes per IP ─────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
    data: null,
    error: 'Rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// More lenient limiter for password reset (5 per hour per IP)
const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again in 1 hour.',
    data: null,
    error: 'Rate limit exceeded',
  },
});

// ── Public routes ──────────────────────────────────────────────────
router.post('/login', authLimiter, loginValidation, login);
router.post('/register', registerValidation, register);
router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password/:token', resetPassword);

// ── Protected routes ───────────────────────────────────────────────
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
