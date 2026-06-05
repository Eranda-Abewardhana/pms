const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// ── @route   GET /api/v1/users ────────────────────────────────────
// ── @access  Admin ────────────────────────────────────────────────
exports.getUsers = asyncHandler(async (req, res) => {
  const { role, isActive, search, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    message: 'Users fetched successfully',
    data: { users, total, page: Number(page), totalPages: Math.ceil(total / limit) },
    error: null,
  });
});

// ── @route   GET /api/v1/users/:id ───────────────────────────────
// ── @access  Admin ───────────────────────────────────────────────
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found', data: null, error: 'Not found' });
  }
  res.status(200).json({ success: true, message: 'User fetched', data: { user }, error: null });
});

// ── @route   POST /api/v1/users ──────────────────────────────────
// ── @access  Admin ──────────────────────────────────────────────
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, specialization, department } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered', data: null, error: 'Duplicate email' });
  }

  const user = await User.create({ name, email, password, role, phone, specialization, department });
  logActivity({ userId: req.user.id, action: 'CREATE_USER', ip: req.ip, meta: { targetId: user._id, role } });

  res.status(201).json({ success: true, message: 'User created successfully', data: { user }, error: null });
});

// ── @route   PUT /api/v1/users/:id ───────────────────────────────
// ── @access  Admin ───────────────────────────────────────────────
exports.updateUser = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'email', 'phone', 'role', 'isActive', 'specialization', 'department', 'gender', 'dateOfBirth', 'address'];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found', data: null, error: 'Not found' });
  }

  logActivity({ userId: req.user.id, action: 'UPDATE_USER', ip: req.ip, meta: { targetId: user._id } });
  res.status(200).json({ success: true, message: 'User updated successfully', data: { user }, error: null });
});

// ── @route   DELETE /api/v1/users/:id ────────────────────────────
// ── @access  Admin ────────────────────────────────────────────────
exports.deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account', data: null, error: 'Self-delete' });
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found', data: null, error: 'Not found' });
  }
  logActivity({ userId: req.user.id, action: 'DELETE_USER', ip: req.ip, meta: { targetId: req.params.id } });
  res.status(200).json({ success: true, message: 'User deleted successfully', data: null, error: null });
});

// ── @route   PATCH /api/v1/users/:id/toggle-status ───────────────
// ── @access  Admin ───────────────────────────────────────────────
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found', data: null, error: 'Not found' });
  }
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  logActivity({ userId: req.user.id, action: user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', ip: req.ip, meta: { targetId: user._id } });
  res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: { user }, error: null });
});

// ── @route   GET /api/v1/users/doctors ───────────────────────────
// ── @access  Receptionist, Patient ───────────────────────────────
exports.getDoctors = asyncHandler(async (req, res) => {
  const doctors = await User.find({ role: 'doctor', isActive: true })
    .select('name email specialization department phone')
    .sort({ name: 1 });
  res.status(200).json({ success: true, message: 'Doctors fetched', data: { doctors }, error: null });
});

// ── @route   PATCH /api/v1/users/:id/reset-password ──────────────
// ── @access  Admin ────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters', data: null, error: 'Validation' });
  }
  const user = await User.findById(req.params.id).select('+password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found', data: null, error: 'Not found' });
  }
  user.password = newPassword; // pre-save hook will hash it
  await user.save();
  logActivity({ userId: req.user.id, action: 'RESET_PASSWORD', ip: req.ip, meta: { targetId: user._id } });
  res.status(200).json({ success: true, message: 'Password reset successfully', data: null, error: null });
});
