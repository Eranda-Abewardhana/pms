const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Patient = require('../models/Patient');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');
const sendEmail = require('../utils/sendEmail');

// ── Helper: sign JWT ──────────────────────────────────────────────
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '1d',
  });

// ── Helper: send token response ──────────────────────────────────
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = signToken(user.id, user.role);

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      token,
      user: {
        id: user.id,
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

  const userExists = await User.findOne({ where: { email } });
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

  const count = await Patient.count();
  const patientId = `MMC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

  await Patient.create({
    userId: user.id,
    patientId,
    name,
    email,
    phone,
    nic,
    gender,
    dateOfBirth,
  });

  logActivity({
    userId: user.id,
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

  const user = await User.scope('withPassword').findOne({ where: { email } });
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
  await user.save();

  logActivity({
    userId: user.id,
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
  const user = await User.findByPk(req.user.id);
  res.status(200).json({ success: true, data: { user } });
});

// ── @route   POST /api/v1/auth/forgot-password ───────────────────
// ── @access  Public ──────────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide your email address' });
  }

  const user = await User.findOne({ where: { email } });

  // Always return success even if email not found (security: no email enumeration)
  const successMsg = "If that email exists in our system, a reset link has been sent.";

  if (!user) {
    return res.status(200).json({ success: true, message: successMsg });
  }

  // Generate token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Save hashed token + expiry (1 hour)
  await user.update({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: new Date(Date.now() + 60 * 60 * 1000),
  });

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align:center; margin-bottom: 32px;">
        <h1 style="color:#1e40af; font-size:24px; margin:0;">🏥 Metro Medi Care</h1>
        <p style="color:#6b7280; margin:4px 0 0;">Patient Management System</p>
      </div>
      <h2 style="color:#111827; font-size:20px;">Reset Your Password</h2>
      <p style="color:#374151; line-height:1.6;">
        Hi <strong>${user.name}</strong>,<br/><br/>
        We received a request to reset the password for your Metro Medi Care account.
        Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
      </p>
      <div style="text-align:center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color:#1e40af; color:#ffffff; padding:14px 32px; text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px; display:inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color:#6b7280; font-size:14px;">
        If you didn't request this, you can safely ignore this email. Your password will remain unchanged.<br/><br/>
        Or copy this link: <a href="${resetUrl}" style="color:#1e40af;">${resetUrl}</a>
      </p>
      <hr style="border:none; border-top:1px solid #e5e7eb; margin: 32px 0;" />
      <p style="color:#9ca3af; font-size:12px; text-align:center;">
        © ${new Date().getFullYear()} Metro Medi Care. All rights reserved.
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request — Metro Medi Care',
      html,
      text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
    });
  } catch (err) {
    // If email fails, clear the token so user can try again
    await user.update({ resetPasswordToken: null, resetPasswordExpire: null });
    console.error('[forgotPassword] Email send failed:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again later.' });
  }

  res.status(200).json({ success: true, message: successMsg });
});

// ── @route   POST /api/v1/auth/reset-password/:token ─────────────
// ── @access  Public ──────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  // Hash the raw token from URL to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.scope('withPassword').findOne({
    where: {
      resetPasswordToken: hashedToken,
    },
  });

  if (!user) {
    return res.status(400).json({ success: false, message: 'Invalid reset token' });
  }

  // Check expiry
  if (!user.resetPasswordExpire || new Date(user.resetPasswordExpire) < new Date()) {
    return res.status(400).json({ success: false, message: 'Reset token has expired. Please request a new one.' });
  }

  // Update password and clear token
  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpire = null;
  await user.save();

  logActivity({
    userId: user.id,
    userRole: user.role,
    action: 'RESET_PASSWORD',
    module: 'auth',
    description: 'Password reset via email link',
    ipAddress: req.ip,
  });

  sendTokenResponse(user, 200, res, 'Password reset successful');
});
