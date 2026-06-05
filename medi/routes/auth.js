const express = require('express');
const rateLimit = require('express-rate-limit');
const { login, logout, getMe, loginValidation } = require('../controllers/authController');
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

// ── Public routes ──────────────────────────────────────────────────
router.post('/login', authLimiter, loginValidation, login);

// ── Protected routes ───────────────────────────────────────────────
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
