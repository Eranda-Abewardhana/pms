const Invoice = require('../models/Invoice');
const Patient = require('../models/Patient');
const Payment = require('../models/Payment');
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
    patient,
    appointment,
    labTest,
    items: processedItems,
    taxRate: taxRate || 0,
    discount: discount || 0,
    dueDate,
    notes,
    processedBy: req.user.id,
  });

  await invoice.populate({ path: 'patient', select: 'name patientId' });

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'CREATE_INVOICE',
    module: 'billing',
    description: `Created invoice ${invoice.invoiceId} for patient ${patient}`,
    targetId: invoice._id,
    ipAddress: req.ip,
  });

  res.status(201).json({ success: true, message: 'Invoice created', data: { invoice } });
});

// @desc    Get all invoices with filtering
// @route   GET /api/v1/billing
exports.getInvoices = asyncHandler(async (req, res) => {
  const { status, patient, page = 1, limit = 20, startDate, endDate } = req.query;
  const filter = {};

  if (status) {
    const statuses = status.split(',').map((s) => s.trim());
    filter.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
  }
  if (patient) filter.patient = patient;

  if (startDate && endDate) {
    filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [invoices, total] = await Promise.all([
    Invoice.find(filter)
      .populate({ path: 'patient', populate: { path: 'userId', select: 'name email phone' } })
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Invoice.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: { invoices, total, page: Number(page), totalPages: Math.ceil(total / limit) },
  });
});

// @desc    Process payment and create transaction record
// @route   POST /api/v1/billing/:id/pay
exports.processPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, transactionId } = req.body;
  const invoice = await Invoice.findById(req.params.id);

  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
  if (invoice.status === 'paid') return res.status(400).json({ success: false, message: 'Invoice already paid' });

  const paidAmount = Number(amount);
  invoice.paidAmount = (invoice.paidAmount || 0) + paidAmount;
  invoice.paymentMethod = paymentMethod || 'cash';
  if (transactionId) invoice.transactionId = transactionId;
  invoice.processedBy = req.user.id;
  
  await invoice.save();

  // Create a Transaction record in the Payment model
  const paymentCount = await Payment.countDocuments();
  await Payment.create({
    paymentId: `PAY-${Date.now()}-${String(paymentCount + 1).padStart(4, '0')}`,
    patientId: invoice.patient,
    appointmentId: invoice.appointment,
    processedBy: req.user.id,
    items: invoice.items.map(it => ({ description: it.description, amount: it.amount })),
    subtotal: invoice.subtotal,
    tax: invoice.taxAmount,
    discount: invoice.discount,
    totalAmount: paidAmount,
    paymentMethod: paymentMethod || 'cash',
    paymentStatus: 'paid',
    transactionId: transactionId,
    paidAt: new Date(),
  });

  logActivity({
    userId: req.user.id,
    userRole: req.user.role,
    action: 'PROCESS_PAYMENT',
    module: 'billing',
    description: `Processed payment of ${amount} for invoice ${invoice.invoiceId}`,
    targetId: invoice._id,
    ipAddress: req.ip,
  });

  await invoice.populate({ path: 'patient', populate: { path: 'userId', select: 'name email phone' } });

  res.status(200).json({ success: true, message: 'Payment processed successfully', data: { invoice } });
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

  const [pendingCount, totalInvoices, todayPaid, weeklyPaid] = await Promise.all([
    Invoice.countDocuments({ status: { $in: ['unpaid', 'partial', 'draft'] } }),
    Invoice.countDocuments({}),
    Invoice.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, total: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: { status: { $in: ['paid', 'partial'] }, updatedAt: { $gte: weekAgo } } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      pendingCount,
      totalInvoices,
      todayIncome: todayPaid[0]?.total || 0,
      todayCount: todayPaid[0]?.count || 0,
      weeklyIncome: weeklyPaid[0]?.total || 0,
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

  const results = await Invoice.aggregate([
    { $match: { status: { $in: ['paid', 'partial'] }, updatedAt: { $gte: days[0] } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
        total: { $sum: '$paidAmount' },
        count: { $sum: 1 },
      },
    },
  ]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const trend = days.map((d) => {
    const key = d.toISOString().slice(0, 10);
    const found = results.find((r) => r._id === key);
    return { date: key, name: dayNames[d.getDay()], amount: found?.total || 0, count: found?.count || 0 };
  });

  res.status(200).json({ success: true, data: trend });
});

// @desc    Get transaction analytics
// @route   GET /api/v1/billing/analytics
exports.getTransactionAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const match = { status: { $in: ['paid', 'partial'] } };

  if (startDate && endDate) {
    match.updatedAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const [byMethod, byCategory, monthlySummary] = await Promise.all([
    Invoice.aggregate([
      { $match: match },
      { $group: { _id: '$paymentMethod', total: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: { _id: '$items.category', total: { $sum: '$items.amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]),
    Invoice.aggregate([
      {
        $match: {
          status: { $in: ['paid', 'partial'] },
          updatedAt: { $gte: new Date(new Date().getFullYear(), 0, 1) },
        },
      },
      { $group: { _id: { $month: '$updatedAt' }, total: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formattedMonthly = monthlySummary.map((m) => ({
    month: monthNames[m._id - 1],
    total: m.total,
    count: m.count,
  }));

  res.status(200).json({
    success: true,
    data: { byMethod, byCategory, monthlySummary: formattedMonthly },
  });
});

// @desc    Get daily income summary
// @route   GET /api/v1/billing/daily-summary
exports.getDailyIncome = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const summary = await Invoice.aggregate([
    { $match: { status: { $in: ['paid', 'partial'] }, updatedAt: { $gte: today } } },
    { $group: { _id: '$paymentMethod', total: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
  ]);

  res.status(200).json({ success: true, data: summary });
});

// @desc    Get current patient's invoices
// @route   GET /api/v1/billing/my
exports.getMyInvoices = asyncHandler(async (req, res) => {
  const profile = await Patient.findOne({ userId: req.user.id });
  if (!profile) return res.status(404).json({ success: false, message: 'Patient profile not found' });
  const invoices = await Invoice.find({ patient: profile._id })
    .populate('appointment', 'appointmentId date timeSlot')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: invoices });
});

// @desc    Get single invoice
// @route   GET /api/v1/billing/:id
exports.getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate({ path: 'patient', populate: { path: 'userId', select: 'name email phone' } })
    .populate('processedBy', 'name')
    .populate('appointment', 'appointmentId date');
  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
  res.status(200).json({ success: true, data: invoice });
});

// @desc    Update invoice
// @route   PUT /api/v1/billing/:id
exports.updateInvoice = asyncHandler(async (req, res) => {
  let invoice = await Invoice.findById(req.params.id);

  if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });

  invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: invoice });
});

// @desc    Verify payment status for appointments and lab tests
// @route   GET /api/v1/billing/verify/:patientId
exports.verifyPatientPayments = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const Appointment = require('../models/Appointment');
  const LabTest = require('../models/LabTest');

  const invoices = await Invoice.find({ patient: patientId }).lean();
  const aptInvoiceMap = {};
  const labInvoiceMap = {};

  invoices.forEach((inv) => {
    if (inv.appointment) aptInvoiceMap[inv.appointment.toString()] = inv;
    if (inv.labTest) labInvoiceMap[inv.labTest.toString()] = inv;
    inv.items.forEach(item => {
      if (item.labTestId) labInvoiceMap[item.labTestId.toString()] = inv;
    });
  });

  const [appointments, labTests] = await Promise.all([
    Appointment.find({ patientId }).populate('doctorId', 'name').sort({ date: -1 }).limit(15).lean(),
    LabTest.find({ patient: patientId }).sort({ createdAt: -1 }).limit(15).lean(),
  ]);

  const annotatedAppointments = appointments.map((apt) => {
    const inv = aptInvoiceMap[apt._id.toString()];
    return {
      _id: apt._id,
      appointmentId: apt.appointmentId,
      date: apt.date,
      type: apt.type,
      appointmentStatus: apt.status,
      doctor: { name: apt.doctorId?.name || '—' },
      invoiceStatus: inv ? inv.status : 'none',
      invoiceId: inv ? inv._id : null,
      invoiceAmount: inv ? inv.totalAmount : null,
    };
  });

  const annotatedLabs = labTests.map((lab) => {
    const inv = labInvoiceMap[lab._id.toString()];
    return {
      _id: lab._id,
      testName: lab.testType === 'Other' ? lab.customTestName : lab.testType,
      category: lab.priority || 'routine',
      status: lab.status,
      createdAt: lab.createdAt,
      invoiceStatus: inv ? inv.status : 'none',
      invoiceId: inv ? inv._id : null,
      invoiceAmount: inv ? inv.totalAmount : null,
    };
  });

  res.status(200).json({
    success: true,
    data: { appointments: annotatedAppointments, labTests: annotatedLabs },
  });
});
