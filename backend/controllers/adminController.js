const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/sequelize');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const ActivityLog = require('../models/ActivityLog');
const Patient = require('../models/Patient');
const LabTest = require('../models/LabTest');
const Invoice = require('../models/Invoice');
const Feedback = require('../models/Feedback');
const SystemConfig = require('../models/SystemConfig');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// ─────────────────────────────────────────────────────────────
// @desc    GET Admin Dashboard Stats
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalPatients,
    totalDoctors,
    totalStaff,
    todayAppointments,
    pendingLabTests,
    totalRevenueResult,
    recentActivity,
  ] = await Promise.all([
    User.count(),
    Patient.count(),
    User.count({ where: { role: 'doctor', isActive: true } }),
    User.count({ where: { role: { [Op.in]: ['nurse', 'receptionist', 'labtech', 'cashier'] }, isActive: true } }),
    Appointment.count({ where: { date: { [Op.gte]: today } } }),
    LabTest.count({ where: { status: 'pending' } }),
    Invoice.findAll({
      where: { status: 'paid' },
      attributes: [[fn('SUM', col('paidAmount')), 'total']],
      raw: true,
    }),
    ActivityLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['name', 'role'] }],
      order: [['createdAt', 'DESC']],
      limit: 10,
    }),
  ]);

  const stats = {
    totalUsers,
    totalPatients,
    totalDoctors,
    totalStaff,
    todayAppointments,
    pendingLabTests,
    revenue: Number(totalRevenueResult[0]?.total || 0),
  };

  const recentActivityFormatted = recentActivity.map((log) => ({
    id: log.id,
    name: log.user?.name || 'System',
    role: log.user?.role || 'system',
    action: log.description || log.action,
    module: log.module,
    time: formatTimeAgo(log.createdAt),
  }));

  res.status(200).json({
    success: true,
    data: {
      stats,
      recentActivity: recentActivityFormatted,
      systemStatus: {
        serverLoad: Math.floor(Math.random() * 30) + 10,
        storageUsage: 65,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    GET Receptionist Dashboard Stats
// @route   GET /api/v1/admin/receptionist-stats
// @access  Private/Admin/Receptionist
// ─────────────────────────────────────────────────────────────
exports.getReceptionistStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayCheckins, newRegistrations, totalAppointmentsToday, recentActivity] = await Promise.all([
    Appointment.count({ where: { date: { [Op.gte]: today, [Op.lt]: tomorrow }, status: 'arrived' } }),
    Patient.count({ where: { createdAt: { [Op.gte]: today } } }),
    Appointment.count({ where: { date: { [Op.gte]: today, [Op.lt]: tomorrow } } }),
    ActivityLog.findAll({
      where: { module: 'patients' },
      include: [{ model: User, as: 'user', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      limit: 5,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: { todayCheckins, newRegistrations, totalAppointmentsToday },
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        action: log.description,
        time: formatTimeAgo(log.createdAt),
        patientInfo: log.targetId ? `Patient #${log.targetId}` : '',
      })),
    },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    GET Doctors list for dashboard
// @route   GET /api/v1/admin/doctors
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────
exports.getDashboardDoctors = asyncHandler(async (req, res) => {
  const doctors = await User.findAll({
    where: { role: 'doctor', isActive: true },
    attributes: ['id', 'name', 'email', 'specialization', 'department', 'phone'],
    order: [['name', 'ASC']],
    limit: 10,
  });

  res.status(200).json({
    success: true,
    data: { doctors },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    GET Monthly activity chart data (last 7 months)
// @route   GET /api/v1/admin/activity-chart
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────
exports.getActivityChart = asyncHandler(async (req, res) => {
  const months = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('default', { month: 'short' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    });
  }

  const rangeStart = months[0].start;
  const rangeEnd = months[months.length - 1].end;

  const [appointmentAgg, patientAgg] = await Promise.all([
    Appointment.findAll({
      where: { date: { [Op.between]: [rangeStart, rangeEnd] } },
      attributes: [
        [fn('YEAR', col('date')), 'year'],
        [fn('MONTH', col('date')), 'month'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('YEAR', col('date')), fn('MONTH', col('date'))],
      raw: true,
    }),
    Patient.findAll({
      where: { createdAt: { [Op.between]: [rangeStart, rangeEnd] } },
      attributes: [
        [fn('YEAR', col('createdAt')), 'year'],
        [fn('MONTH', col('createdAt')), 'month'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('YEAR', col('createdAt')), fn('MONTH', col('createdAt'))],
      raw: true,
    }),
  ]);

  const apptMap = {};
  appointmentAgg.forEach((r) => {
    apptMap[`${r.year}-${r.month}`] = Number(r.count);
  });

  const patientMap = {};
  patientAgg.forEach((r) => {
    patientMap[`${r.year}-${r.month}`] = Number(r.count);
  });

  const chartData = months.map(({ label, start }) => {
    const key = `${start.getFullYear()}-${start.getMonth() + 1}`;
    return {
      month: label,
      consultations: apptMap[key] || 0,
      patients: patientMap[key] || 0,
    };
  });

  res.status(200).json({
    success: true,
    data: { chartData },
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    GET Recent appointments for admin dashboard table
// @route   GET /api/v1/admin/recent-appointments
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────
exports.getRecentAppointments = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;

  const appointments = await Appointment.findAll({
    include: [
      { model: Patient, as: 'patient', attributes: ['id', 'name', 'gender'] },
      { model: User, as: 'doctor', attributes: ['id', 'name', 'specialization'] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
  });

  const formatted = appointments.map((appt, idx) => ({
    no: String(idx + 1).padStart(2, '0'),
    name: appt.patient?.name || 'Unknown',
    date: appt.date
      ? new Date(appt.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) +
        ' ' + (appt.timeSlot || '')
      : 'N/A',
    gender: appt.patient?.gender
      ? appt.patient.gender.charAt(0).toUpperCase() + appt.patient.gender.slice(1)
      : '—',
    doctor: appt.doctor?.name || 'Unassigned',
    status: appt.status,
    appointmentId: appt.id,
  }));

  res.status(200).json({
    success: true,
    data: { appointments: formatted },
  });
});

// ─────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────

// @desc    Get all users with filtering
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 10 } = req.query;
  const where = {};

  if (role && role !== 'all') where.role = role;

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
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
    count: users.length,
    total,
    pages: Math.ceil(total / limit),
    data: users,
  });
});

// @desc    Create a user
exports.createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);

  // If role is patient, also create a Patient record if it doesn't exist
  if (user.role === 'patient') {
    const existingPatient = await Patient.findOne({ where: { email: user.email } });
    if (!existingPatient) {
      const count = await Patient.count();
      const patientId = `P-${1000 + count + 1}`;

      await Patient.create({
        userId: user.id,
        patientId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        nic: user.nic,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        bloodGroup: user.bloodGroup,
      });
    }
  }

  res.status(201).json({ success: true, data: user });
});

// @desc    Update a user
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: `User not found with id of ${req.params.id}` });
  }
  await user.update(req.body);
  res.status(200).json({ success: true, data: user });
});

// @desc    Delete a user (Soft delete)
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: `User not found with id of ${req.params.id}` });
  }
  await user.update({ isActive: false });
  res.status(200).json({ success: true, data: {} });
});

// @desc    Toggle user status
exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: `User not found with id of ${req.params.id}` });
  }
  await user.update({ isActive: !user.isActive });
  res.status(200).json({ success: true, data: user });
});

// @desc    Reset user password
exports.resetUserPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await User.scope('withPassword').findByPk(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: `User not found with id of ${req.params.id}` });
  }
  user.password = password;
  await user.save();
  res.status(200).json({ success: true, message: 'Password reset successful' });
});

// ─────────────────────────────────────────────────────────────
// PATIENT & FEEDBACK & CONFIG
// ─────────────────────────────────────────────────────────────

// @desc    Get all patients
exports.getAllPatients = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { patientId: { [Op.like]: `%${search}%` } },
      { nic: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
    ];
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { rows: patients, count: total } = await Patient.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    offset,
    limit: Number(limit),
  });

  res.status(200).json({ success: true, total, data: patients });
});

// @desc    Get all feedback
exports.getAllFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findAll({
    include: [
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      },
      { model: User, as: 'doctor', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({ success: true, data: feedback });
});

// @desc    Get system config
exports.getSystemConfig = asyncHandler(async (req, res) => {
  let config = await SystemConfig.findOne({ order: [['createdAt', 'ASC']] });
  if (!config) {
    config = await SystemConfig.create({});
  }
  res.status(200).json({ success: true, data: config });
});

// @desc    Update system config
exports.updateSystemConfig = asyncHandler(async (req, res) => {
  let config = await SystemConfig.findOne({ order: [['createdAt', 'ASC']] });
  if (!config) {
    config = await SystemConfig.create(req.body);
  } else {
    await config.update(req.body);
  }
  res.status(200).json({ success: true, data: config });
});

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────

// @desc    Get Revenue Report (last 6 months)
exports.getRevenueReport = asyncHandler(async (req, res) => {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('default', { month: 'short' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    });
  }

  const rangeStart = months[0].start;
  const rangeEnd = months[months.length - 1].end;

  const revenueAgg = await Invoice.findAll({
    where: {
      status: 'paid',
      updatedAt: { [Op.between]: [rangeStart, rangeEnd] },
    },
    attributes: [
      [fn('YEAR', col('updatedAt')), 'year'],
      [fn('MONTH', col('updatedAt')), 'month'],
      [fn('SUM', col('paidAmount')), 'revenue'],
    ],
    group: [fn('YEAR', col('updatedAt')), fn('MONTH', col('updatedAt'))],
    raw: true,
  });

  const revMap = {};
  revenueAgg.forEach((r) => {
    revMap[`${r.year}-${r.month}`] = Number(r.revenue);
  });

  const revenueData = months.map(({ label, start }) => {
    const key = `${start.getFullYear()}-${start.getMonth() + 1}`;
    return { month: label, revenue: revMap[key] || 0 };
  });

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const totalYTDResult = await Invoice.findAll({
    where: { status: 'paid', updatedAt: { [Op.gte]: startOfYear } },
    attributes: [[fn('SUM', col('paidAmount')), 'total']],
    raw: true,
  });

  res.status(200).json({
    success: true,
    data: {
      revenueData,
      totalYTD: Number(totalYTDResult[0]?.total || 0),
    },
  });
});

// @desc    Get Appointment Report (Distribution by status)
exports.getAppointmentReport = asyncHandler(async (req, res) => {
  const appointmentAgg = await Appointment.findAll({
    attributes: [
      'status',
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['status'],
    raw: true,
  });

  const colors = {
    completed: '#00C6B3',
    cancelled: '#FF6B6B',
    pending: '#FF9F43',
    booked: '#4B9EFF',
    arrived: '#A78BFA',
  };

  const appointmentData = appointmentAgg.map(({ status, count }) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: Number(count),
    color: colors[status] || '#8A94A6',
  }));

  const total = appointmentData.reduce((acc, curr) => acc + curr.value, 0);

  res.status(200).json({
    success: true,
    data: { appointmentData, total },
  });
});

// @desc    Get Lab Report (Distribution by status and most requested tests)
exports.getLabReport = asyncHandler(async (req, res) => {
  const [statusAgg, typeAgg] = await Promise.all([
    LabTest.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }),
    LabTest.findAll({
      attributes: ['testType', [fn('COUNT', col('id')), 'count']],
      group: ['testType'],
      order: [[fn('COUNT', col('id')), 'DESC']],
      limit: 5,
      raw: true,
    }),
  ]);

  const colors = {
    completed: '#34D399',
    pending: '#FF9F43',
    'in-progress': '#4B9EFF',
    cancelled: '#FF6B6B',
  };

  const statusData = statusAgg.map(({ status, count }) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: Number(count),
    color: colors[status] || '#8A94A6',
  }));

  const testTypeData = typeAgg.map(({ testType, count }) => ({
    name: testType,
    count: Number(count),
  }));

  res.status(200).json({
    success: true,
    data: {
      statusData,
      testTypeData,
      total: statusData.reduce((acc, curr) => acc + curr.value, 0),
    },
  });
});

// ─────────────────────────────────────────────────────────────
// ACTIVITY LOGS
// ─────────────────────────────────────────────────────────────

// @desc    Get paginated activity logs with filters
// @route   GET /api/v1/admin/activity-logs
// @access  Private/Admin
exports.getActivityLogs = asyncHandler(async (req, res) => {
  const { role, action, startDate, endDate, page = 1, limit = 25 } = req.query;
  const where = {};

  if (role) where.userRole = role;
  if (action) where.action = { [Op.like]: `%${action}%` };
  if (startDate && endDate) {
    where.createdAt = { [Op.between]: [new Date(startDate), new Date(`${endDate}T23:59:59`)] };
  } else if (startDate) {
    where.createdAt = { [Op.gte]: new Date(startDate) };
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { rows, count: total } = await ActivityLog.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'role'], required: false }],
    order: [['createdAt', 'DESC']],
    offset,
    limit: Number(limit),
  });

  res.status(200).json({
    success: true,
    total,
    pages: Math.ceil(total / limit),
    data: rows,
  });
});

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + ' hour' + (interval > 1 ? 's' : '') + ' ago';
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + ' min' + (interval > 1 ? 's' : '') + ' ago';
  return Math.floor(seconds) + ' seconds ago';
}
