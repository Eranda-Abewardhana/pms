const { Op } = require('sequelize');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// ── @route   GET /api/v1/users ────────────────────────────────────
// ── @access  Admin ────────────────────────────────────────────────
exports.getUsers = asyncHandler(async (req, res) => {
  const { role, isActive, search, page = 1, limit = 20 } = req.query;
  const where = {};

  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === 'true';
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { rows: users, count: total } = await User.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    offset,
    limit: Number(limit),
  });

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
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found', data: null, error: 'Not found' });
  }
  res.status(200).json({ success: true, message: 'User fetched', data: { user }, error: null });
});

// ── @route   POST /api/v1/users ──────────────────────────────────
// ── @access  Admin ──────────────────────────────────────────────
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, specialization, department } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered', data: null, error: 'Duplicate email' });
  }

  const user = await User.create({ name, email, password, role, phone, specialization, department });

  logActivity({ userId: req.user.id, userRole: req.user.role, action: 'CREATE_USER', module: 'users', description: `Created user ${name} (${role})`, targetId: user.id, ipAddress: req.ip });

  res.status(201).json({ success: true, message: 'User created successfully', data: { user }, error: null });
});

// ── @route   PUT /api/v1/users/:id ───────────────────────────────
// ── @access  Admin ───────────────────────────────────────────────
exports.updateUser = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'email', 'phone', 'role', 'isActive', 'specialization', 'department', 'gender', 'dateOfBirth', 'address'];
  const updates = {};
  allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found', data: null, error: 'Not found' });
  }

  await user.update(updates);

  logActivity({ userId: req.user.id, userRole: req.user.role, action: 'UPDATE_USER', module: 'users', description: `Updated user ${user.name}`, targetId: user.id, ipAddress: req.ip });
  res.status(200).json({ success: true, message: 'User updated successfully', data: { user }, error: null });
});

// ── @route   DELETE /api/v1/users/:id ────────────────────────────
// ── @access  Admin ────────────────────────────────────────────────
exports.deleteUser = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (id === Number(req.user.id)) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account', data: null, error: 'Self-delete' });
  }
  const user = await User.findByPk(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found', data: null, error: 'Not found' });
  }
  await user.destroy();
  logActivity({ userId: req.user.id, userRole: req.user.role, action: 'DELETE_USER', module: 'users', description: `Deleted user id ${id}`, targetId: id, ipAddress: req.ip });
  res.status(200).json({ success: true, message: 'User deleted successfully', data: null, error: null });
});

// ── @route   PATCH /api/v1/users/:id/toggle-status ───────────────
// ── @access  Admin ───────────────────────────────────────────────
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found', data: null, error: 'Not found' });
  }
  await user.update({ isActive: !user.isActive });
  logActivity({ userId: req.user.id, userRole: req.user.role, action: user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER', module: 'users', description: `Toggled status for ${user.name}`, targetId: user.id, ipAddress: req.ip });
  res.status(200).json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: { user }, error: null });
});

// ── @route   GET /api/v1/users/doctors ───────────────────────────
// ── @access  Receptionist, Patient ───────────────────────────────
exports.getDoctors = asyncHandler(async (req, res) => {
  const doctors = await User.findAll({
    where: { role: 'doctor', isActive: true },
    attributes: ['id', 'name', 'email', 'specialization', 'department', 'phone'],
    order: [['name', 'ASC']],
  });
  res.status(200).json({ success: true, message: 'Doctors fetched', data: { doctors }, error: null });
});

// ── @route   PATCH /api/v1/users/:id/reset-password ──────────────
// ── @access  Admin ────────────────────────────────────────────────
exports.resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters', data: null, error: 'Validation' });
  }
  const user = await User.scope('withPassword').findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found', data: null, error: 'Not found' });
  }
  user.password = newPassword; // beforeUpdate hook will hash it
  await user.save();
  logActivity({ userId: req.user.id, userRole: req.user.role, action: 'RESET_PASSWORD', module: 'users', description: `Reset password for user id ${req.params.id}`, targetId: Number(req.params.id), ipAddress: req.ip });
  res.status(200).json({ success: true, message: 'Password reset successfully', data: null, error: null });
});
