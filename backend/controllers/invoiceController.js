const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/sequelize');
const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../utils/asyncHandler');
const logActivity = require('../utils/logActivity');

// @desc    Create new invoice
// @route   POST /api/v1/billing
exports.createInvoice = asyncHandler(async (req, res) => {
  const { patient, appointment, labTest, items, taxRate, discount, dueDate, notes } = req.body;

  const processedItems = (items || []).map((item) => ({
    ...item,
    amount: item.quantity * item.unitPrice,
  }));

  const invoice = await Invoice.create({
    patientId: patient,
    appointmentId: appointment || null,
    labTestId: labTest || null,
    items: processedItems,
    taxRate: taxRate || 0,
    discount: discount || 0,
    dueDate,
    notes,
    processedBy: req.user.id,
  });

  const populated = await Invoice.findByPk(invoice.id, {
    include: [{ model: Patient, as: 'patient', attributes: ['id', 'name', 'patientId'] }],
  });

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'CREATE_INVOICE',
    module: 'billing',
    description: `Created invoice ${invoice.invoiceId} for patient ${patient}`,
    targetId: invoice.id,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, message: 'Invoice created', data: { invoice: populated } });
});

// @desc    Get all invoices with filtering
// @route   GET /api/v1/billing
exports.getInvoices = asyncHandler(async (req, res) => {
  const { status, patient, page = 1, limit = 20, startDate, endDate } = req.query;
  const where = {};

  if (status) {
    const statuses = status.split(',').map((s) => s.trim());
    where.status = statuses.length > 1 ? { [Op.in]: statuses } : statuses[0];
  }
  if (patient) where.patientId = patient;
  if (startDate && endDate) {
    where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { rows: invoices, count: total } = await Invoice.findAndCountAll({
    where,
    include: [
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
      },
      { model: User, as: 'processor', attributes: ['id', 'name'] },
    ],
    order: [['createdAt', 'DESC']],
    offset,
    limit: Number(limit),
  });

  res.status(200).json({
    success: true,
    data: { invoices, total, page: Number(page), totalPages: Math.ceil(total / limit) },
  });
});

// @desc    Process payment and create transaction record
// @route   POST /api/v1/billing/:id/pay
exports.processPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, transactionId } = req.body;
  const invoice = await Invoice.findByPk(req.params.id);

  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
  if (invoice.status === 'paid') return res.status(400).json({ success: false, message: 'Invoice already paid' });

  const paidAmount = Number(amount);
  await invoice.update({
    paidAmount: Number(invoice.paidAmount || 0) + paidAmount,
    paymentMethod: paymentMethod || 'cash',
    transactionId: transactionId || invoice.transactionId,
    processedBy: req.user.id,
  });

  // Create a Transaction record in the Payment model
  const paymentCount = await Payment.count();
  await Payment.create({
    paymentId: `PAY-${Date.now()}-${String(paymentCount + 1).padStart(4, '0')}`,
    patientId: invoice.patientId,
    appointmentId: invoice.appointmentId,
    processedBy: req.user.id,
    items: invoice.items ? invoice.items.map((it) => ({ description: it.description, amount: it.amount })) : [],
    subtotal: invoice.subtotal,
    tax: invoice.taxAmount,
    discount: invoice.discount,
    totalAmount: paidAmount,
    paymentMethod: paymentMethod || 'cash',
    paymentStatus: 'paid',
    transactionId,
    paidAt: new Date(),
  });

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'PROCESS_PAYMENT',
    module: 'billing',
    description: `Processed payment of ${amount} for invoice ${invoice.invoiceId}`,
    targetId: invoice.id,
    ipAddress: req.ip,
  });

  const populated = await Invoice.findByPk(invoice.id, {
    include: [
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
      },
    ],
  });

  res.status(200).json({ success: true, message: 'Payment processed successfully', data: { invoice: populated } });
});

// @desc    Get cashier dashboard stats
// @route   GET /api/v1/billing/stats
exports.getCashierStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 6);

  const [pendingCount, totalInvoices, todayPaidStats, weeklyPaidStats] = await Promise.all([
    Invoice.count({ where: { status: { [Op.in]: ['unpaid', 'partial', 'draft'] } } }),
    Invoice.count(),
    Invoice.findAll({
      where: { status: 'paid', paidAt: { [Op.gte]: today, [Op.lt]: tomorrow } },
      attributes: [
        [fn('SUM', col('paidAmount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      raw: true,
    }),
    Invoice.findAll({
      where: {
        status: { [Op.in]: ['paid', 'partial'] },
        updatedAt: { [Op.gte]: weekAgo },
      },
      attributes: [[fn('SUM', col('paidAmount')), 'total']],
      raw: true,
    }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      pendingCount,
      totalInvoices,
      todayIncome: Number(todayPaidStats[0]?.total || 0),
      todayCount: Number(todayPaidStats[0]?.count || 0),
      weeklyIncome: Number(weeklyPaidStats[0]?.total || 0),
    },
  });
});

// @desc    Get 7-day weekly income trend
// @route   GET /api/v1/billing/weekly
exports.getWeeklyIncome = asyncHandler(async (req, res) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }

  const results = await Invoice.findAll({
    where: {
      status: { [Op.in]: ['paid', 'partial'] },
      updatedAt: { [Op.gte]: days[0] },
    },
    attributes: [
      [fn('DATE', col('updatedAt')), 'date'],
      [fn('SUM', col('paidAmount')), 'total'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('DATE', col('updatedAt'))],
    raw: true,
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const trend = days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    const found = results.find((r) => r.date === key);
    return {
      date: key,
      name: dayNames[d.getDay()],
      amount: Number(found?.total || 0),
      count: Number(found?.count || 0),
    };
  });

  res.status(200).json({ success: true, data: trend });
});

// @desc    Get transaction analytics
// @route   GET /api/v1/billing/analytics
exports.getTransactionAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateWhere = startDate && endDate
    ? { updatedAt: { [Op.between]: [new Date(startDate), new Date(endDate)] } }
    : {};

  const baseWhere = { status: { [Op.in]: ['paid', 'partial'] }, ...dateWhere };

  const [byMethod, monthlySummary] = await Promise.all([
    Invoice.findAll({
      where: baseWhere,
      attributes: [
        'paymentMethod',
        [fn('SUM', col('paidAmount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['paymentMethod'],
      raw: true,
    }),
    Invoice.findAll({
      where: {
        status: { [Op.in]: ['paid', 'partial'] },
        updatedAt: { [Op.gte]: new Date(new Date().getFullYear(), 0, 1) },
      },
      attributes: [
        [fn('MONTH', col('updatedAt')), 'month'],
        [fn('SUM', col('paidAmount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('MONTH', col('updatedAt'))],
      order: [[fn('MONTH', col('updatedAt')), 'ASC']],
      raw: true,
    }),
  ]);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formattedMonthly = monthlySummary.map((m) => ({
    month: monthNames[Number(m.month) - 1],
    total: Number(m.total),
    count: Number(m.count),
  }));

  res.status(200).json({
    success: true,
    data: { byMethod, monthlySummary: formattedMonthly },
  });
});

// @desc    Get daily income summary
// @route   GET /api/v1/billing/daily-summary
exports.getDailyIncome = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const summary = await Invoice.findAll({
    where: {
      status: { [Op.in]: ['paid', 'partial'] },
      updatedAt: { [Op.gte]: today },
    },
    attributes: [
      'paymentMethod',
      [fn('SUM', col('paidAmount')), 'total'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: ['paymentMethod'],
    raw: true,
  });

  res.status(200).json({ success: true, data: summary });
});

// @desc    Get current patient's invoices
// @route   GET /api/v1/billing/my
exports.getMyInvoices = asyncHandler(async (req, res) => {
  const profile = await Patient.findOne({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ success: false, message: 'Patient profile not found' });

  const invoices = await Invoice.findAll({
    where: { patientId: profile.id },
    include: [
      { model: Appointment, as: 'appointment', attributes: ['id', 'appointmentId', 'date', 'timeSlot'] },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.status(200).json({ success: true, data: invoices });
});

// @desc    Get single invoice
// @route   GET /api/v1/billing/:id
exports.getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id, {
    include: [
      {
        model: Patient,
        as: 'patient',
        include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone'] }],
      },
      { model: User, as: 'processor', attributes: ['id', 'name'] },
      { model: Appointment, as: 'appointment', attributes: ['id', 'appointmentId', 'date'] },
    ],
  });
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
  res.status(200).json({ success: true, data: invoice });
});

// @desc    Update invoice
// @route   PUT /api/v1/billing/:id
exports.updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByPk(req.params.id);
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
  await invoice.update(req.body);
  res.status(200).json({ success: true, data: invoice });
});

// @desc    Verify payment status for appointments and lab tests
// @route   GET /api/v1/billing/verify/:patientId
exports.verifyPatientPayments = asyncHandler(async (req, res) => {
  const LabTest = require('../models/LabTest');
  const { patientId } = req.params;

  const [invoices, appointments, labTests] = await Promise.all([
    Invoice.findAll({ where: { patientId }, raw: true }),
    Appointment.findAll({
      where: { patientId },
      include: [{ model: User, as: 'doctor', attributes: ['id', 'name'] }],
      order: [['date', 'DESC']],
      limit: 15,
    }),
    LabTest.findAll({
      where: { patientId },
      order: [['createdAt', 'DESC']],
      limit: 15,
      raw: true,
    }),
  ]);

  const aptInvoiceMap = {};
  const labInvoiceMap = {};

  invoices.forEach((inv) => {
    if (inv.appointmentId) aptInvoiceMap[String(inv.appointmentId)] = inv;
    if (inv.labTestId) labInvoiceMap[String(inv.labTestId)] = inv;
  });

  const annotatedAppointments = appointments.map((apt) => {
    const inv = aptInvoiceMap[String(apt.id)];
    return {
      id: apt.id,
      appointmentId: apt.appointmentId,
      date: apt.date,
      type: apt.type,
      appointmentStatus: apt.status,
      doctor: { name: apt.doctor?.name || '—' },
      invoiceStatus: inv ? inv.status : 'none',
      invoiceId: inv ? inv.id : null,
      invoiceAmount: inv ? inv.totalAmount : null,
    };
  });

  const annotatedLabs = labTests.map((lab) => {
    const inv = labInvoiceMap[String(lab.id)];
    return {
      id: lab.id,
      testName: lab.testType === 'Other' ? lab.customTestName : lab.testType,
      category: lab.priority || 'routine',
      status: lab.status,
      createdAt: lab.createdAt,
      invoiceStatus: inv ? inv.status : 'none',
      invoiceId: inv ? inv.id : null,
      invoiceAmount: inv ? inv.totalAmount : null,
    };
  });

  res.status(200).json({
    success: true,
    data: { appointments: annotatedAppointments, labTests: annotatedLabs },
  });
});
