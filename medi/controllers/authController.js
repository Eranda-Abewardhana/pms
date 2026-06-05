const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Patient = require('../models/Patient');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// ── Helper: sign JWT ──────────────────────────────────────────────
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d',
  });

// ── Helper: send token response ──────────────────────────────────
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user._id, user.role);

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    },
    error: null,
  });
};

// ── Validation rules ─────────────────────────────────────────────
exports.loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

exports.registerValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').notEmpty().withMessage('Phone number is required'),
];

// ── @route   POST /api/v1/auth/register ──────────────────────────
// ── @access  Public (Patient Self-Registration) ──────────────────
exports.register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, error: errors.array() });
  }

  const { name, email, password, phone, nic, gender, dateOfBirth } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    nic,
    gender,
    dateOfBirth,
    role: 'patient',
  });

  // Create patient profile
  const count = await Patient.countDocuments();
  const patientId = `MMC-2025-${String(count + 1).padStart(4, '0')}`;
  
  await Patient.create({
    userId: user._id,
    patientId,
    name,
    email,
    phone,
    nic,
    gender,
    dateOfBirth,
  });

  logActivity({
    userId: user._id,
    userRole: 'patient',
    action: 'REGISTER',
    module: 'auth',
    description: 'Patient self-registration',
    ipAddress: req.ip,
  });

  sendTokenResponse(user, 201, res, 'Registration successful');
});

// ── @route   POST /api/v1/auth/login ─────────────────────────────
// ── @access  Public ──────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg, error: errors.array() });
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  logActivity({
    userId: user._id,
    userRole: user.role,
    action: 'LOGIN',
    module: 'auth',
    description: `User logged in: ${user.email}`,
    ipAddress: req.ip,
  });

  sendTokenResponse(user, 200, res, 'Login successful');
});

// ── @route   POST /api/v1/auth/logout ────────────────────────────
// ── @access  Private ─────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'LOGOUT',
    module: 'auth',
    description: 'User logged out',
    ipAddress: req.ip,
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ── @route   GET /api/v1/auth/me ─────────────────────────────────
// ── @access  Private ─────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: { user } });
});
