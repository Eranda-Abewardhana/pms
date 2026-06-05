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
    User.countDocuments(),
    Patient.countDocuments(),
    User.countDocuments({ role: 'doctor', isActive: true }),
    User.countDocuments({ role: { $in: ['nurse', 'receptionist', 'labtech', 'cashier'] }, isActive: true }),
    Appointment.countDocuments({ date: { $gte: today } }),
    LabTest.countDocuments({ status: 'pending' }),
    Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),
    ActivityLog.find()
      .populate('userId', 'name role')
      .sort({ createdAt: -1 })
      .limit(10),
  ]);

  const stats = {
    totalUsers,
    totalPatients,
    totalDoctors,
    totalStaff,
    todayAppointments,
    pendingLabTests,
    revenue: totalRevenueResult[0]?.total || 0,
  };

  const recentActivityFormatted = recentActivity.map((log) => ({
    id: log._id,
    name: log.userId?.name || 'System',
    role: log.userId?.role || 'system',
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

  const [
    todayCheckins,
    newRegistrations,
    totalAppointmentsToday,
    recentActivity
  ] = await Promise.all([
    Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'arrived' }),
    Patient.countDocuments({ createdAt: { $gte: today } }),
    Appointment.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
    ActivityLog.find({ module: 'patients' })
      .populate('userId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
  ]);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        todayCheckins,
        newRegistrations,
        totalAppointmentsToday
      },
      recentActivity: recentActivity.map(log => ({
        id: log._id,
        action: log.description,
        time: formatTimeAgo(log.createdAt),
        patientInfo: log.targetId ? `Patient #${log.targetId.toString().slice(-4)}` : ''
      }))
    }
  });
});

// ─────────────────────────────────────────────────────────────
// @desc    GET Doctors list for dashboard
// @route   GET /api/v1/admin/doctors
// @access  Private/Admin
// ─────────────────────────────────────────────────────────────
exports.getDashboardDoctors = asyncHandler(async (req, res) => {
  const doctors = await User.find({ role: 'doctor', isActive: true })
    .select('name email specialization department phone')
    .sort({ name: 1 })
    .limit(10);

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

  // Build last 7 months date ranges
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('default', { month: 'short' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    });
  }

  // Aggregate appointments per month
  const appointmentAgg = await Appointment.aggregate([
    {
      $match: {
        date: { $gte: months[0].start, $lte: months[months.length - 1].end },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Aggregate new patients per month
  const patientAgg = await Patient.aggregate([
    {
      $match: {
        createdAt: { $gte: months[0].start, $lte: months[months.length - 1].end },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Build lookup maps
  const apptMap = {};
  appointmentAgg.forEach(({ _id, count }) => {
    apptMap[`${_id.year}-${_id.month}`] = count;
  });

  const patientMap = {};
  patientAgg.forEach(({ _id, count }) => {
    patientMap[`${_id.year}-${_id.month}`] = count;
  });

  // Build chart data array
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

  const appointments = await Appointment.find({})
    .populate('patientId', 'name gender age')
    .populate('doctorId', 'name specialization')
    .sort({ createdAt: -1 })
    .limit(limit);

  const formatted = appointments.map((appt, idx) => ({
    no: String(idx + 1).padStart(2, '0'),
    name: appt.patientId?.name || 'Unknown',
    date: appt.date
      ? new Date(appt.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) +
        ' ' +
        (appt.timeSlot || '')
      : 'N/A',
    age: appt.patientId?.age || '—',
    gender: appt.patientId?.gender
      ? appt.patientId.gender.charAt(0).toUpperCase() + appt.patientId.gender.slice(1)
      : '—',
    doctor: appt.doctorId?.name || 'Unassigned',
    status: appt.status,
    appointmentId: appt._id,
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
// @route   GET /api/v1/admin/users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 10 } = req.query;
  const query = {};

  if (role && role !== 'all') {
    query.role = role;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pages: Math.ceil(total / limit),
    data: users,
  });
});

// @desc    Create a user
// @route   POST /api/v1/admin/users
exports.createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);

  // If role is patient, also create a Patient record if it doesn't exist
  if (user.role === 'patient') {
    const existingPatient = await Patient.findOne({ email: user.email });
    if (!existingPatient) {
       // Generate a simple patient ID
       const count = await Patient.countDocuments();
       const patientId = `P-${1000 + count + 1}`;
       
       await Patient.create({
         userId: user._id,
         patientId,
         name: user.name,
         email: user.email,
         phone: user.phone,
         nic: user.nic,
         gender: user.gender,
         dateOfBirth: user.dateOfBirth,
         address: user.address,
         bloodGroup: user.bloodGroup
       });
    }
  }

  res.status(201).json({
    success: true,
    data: user,
  });
});

// @desc    Update a user
// @route   PUT /api/v1/admin/users/:id
exports.updateUser = asyncHandler(async (req, res, next) => {
  let user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Delete a user (Soft delete)
// @route   DELETE /api/v1/admin/users/:id
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  user.isActive = false;
  await user.save();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Toggle user status
// @route   PATCH /api/v1/admin/users/:id/status
exports.toggleUserStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Reset user password
// @route   PATCH /api/v1/admin/users/:id/reset-password
exports.resetUserPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
  }

  user.password = password;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
});

// ─────────────────────────────────────────────────────────────
// PATIENT & FEEDBACK & CONFIG
// ─────────────────────────────────────────────────────────────

// @desc    Get all patients
// @route   GET /api/v1/admin/patients
exports.getAllPatients = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { patientId: { $regex: search, $options: 'i' } },
      { nic: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const patients = await Patient.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Patient.countDocuments(query);

  res.status(200).json({
    success: true,
    total,
    data: patients,
  });
});

// @desc    Get all feedback
// @route   GET /api/v1/admin/feedback
exports.getAllFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find()
    .populate('patientId', 'name')
    .populate('doctorId', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: feedback,
  });
});

// @desc    Get system config
// @route   GET /api/v1/admin/config
exports.getSystemConfig = asyncHandler(async (req, res) => {
  let config = await SystemConfig.findOne();
  
  if (!config) {
    config = await SystemConfig.create({});
  }

  res.status(200).json({
    success: true,
    data: config,
  });
});

// @desc    Update system config
// @route   PUT /api/v1/admin/config
exports.updateSystemConfig = asyncHandler(async (req, res) => {
  let config = await SystemConfig.findOne();
  
  if (!config) {
    config = await SystemConfig.create(req.body);
  } else {
    config = await SystemConfig.findByIdAndUpdate(config._id, req.body, {
      new: true,
      runValidators: true,
    });
  }

  res.status(200).json({
    success: true,
    data: config,
  });
});

// ─────────────────────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────────────────────

// @desc    Get Revenue Report (last 6 months)
// @route   GET /api/v1/admin/reports/revenue
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

  const revenueAgg = await Invoice.aggregate([
    {
      $match: {
        status: 'paid',
        updatedAt: { $gte: months[0].start, $lte: months[months.length - 1].end },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$updatedAt' },
          month: { $month: '$updatedAt' },
        },
        revenue: { $sum: '$paidAmount' },
      },
    },
  ]);

  const revMap = {};
  revenueAgg.forEach(({ _id, revenue }) => {
    revMap[`${_id.year}-${_id.month}`] = revenue;
  });

  const revenueData = months.map(({ label, start }) => {
    const key = `${start.getFullYear()}-${start.getMonth() + 1}`;
    return {
      month: label,
      revenue: revMap[key] || 0,
    };
  });

  // Calculate total YTD revenue
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const totalYTDResult = await Invoice.aggregate([
    { $match: { status: 'paid', updatedAt: { $gte: startOfYear } } },
    { $group: { _id: null, total: { $sum: '$paidAmount' } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      revenueData,
      totalYTD: totalYTDResult[0]?.total || 0,
    },
  });
});

// @desc    Get Appointment Report (Distribution by status)
// @route   GET /api/v1/admin/reports/appointments
exports.getAppointmentReport = asyncHandler(async (req, res) => {
  const appointmentAgg = await Appointment.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const colors = {
    completed: '#00C6B3',
    cancelled: '#FF6B6B',
    pending: '#FF9F43',
    booked: '#4B9EFF',
    arrived: '#A78BFA'
  };

  const appointmentData = appointmentAgg.map(({ _id, count }) => ({
    name: _id.charAt(0).toUpperCase() + _id.slice(1),
    value: count,
    color: colors[_id] || '#8A94A6'
  }));

  const total = appointmentData.reduce((acc, curr) => acc + curr.value, 0);

  res.status(200).json({
    success: true,
    data: {
      appointmentData,
      total
    },
  });
});

// @desc    Get Lab Report (Distribution by status and most requested tests)
// @route   GET /api/v1/admin/reports/lab
exports.getLabReport = asyncHandler(async (req, res) => {
  const [statusAgg, typeAgg] = await Promise.all([
    LabTest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    LabTest.aggregate([
      { $group: { _id: '$testType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
  ]);

  const colors = {
    completed: '#34D399',
    pending: '#FF9F43',
    'in-progress': '#4B9EFF',
    cancelled: '#FF6B6B'
  };

  const statusData = statusAgg.map(({ _id, count }) => ({
    name: _id.charAt(0).toUpperCase() + _id.slice(1),
    value: count,
    color: colors[_id] || '#8A94A6'
  }));

  const testTypeData = typeAgg.map(({ _id, count }) => ({
    name: _id,
    count: count
  }));

  res.status(200).json({
    success: true,
    data: {
      statusData,
      testTypeData,
      total: statusData.reduce((acc, curr) => acc + curr.value, 0)
    },
  });
});

// ─────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + ' hour' + (interval > 1 ? 's' : '') + ' ago';
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + ' min' + (interval > 1 ? 's' : '') + ' ago';
  return Math.floor(seconds) + ' seconds ago';
}
