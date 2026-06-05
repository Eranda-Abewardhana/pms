const { Op, fn, col } = require('sequelize');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Invoice = require('../models/Invoice');
const EMR = require('../models/EMR');
const LabTest = require('../models/LabTest');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Generate Revenue Report
// @route   GET /api/v1/reports/revenue
// @access  Private/Admin/Cashier
exports.getRevenueReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const where = { status: 'paid' };

  if (startDate && endDate) {
    where.updatedAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  }

  const revenueData = await Invoice.findAll({
    where,
    attributes: [
      [fn('DATE', col('updatedAt')), 'date'],
      [fn('SUM', col('paidAmount')), 'total'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('DATE', col('updatedAt'))],
    order: [[fn('DATE', col('updatedAt')), 'ASC']],
    raw: true,
  });

  res.status(200).json({ success: true, data: revenueData });
});

// @desc    Generate Patient Statistics Report
// @route   GET /api/v1/reports/patients
// @access  Private/Admin
exports.getPatientStats = asyncHandler(async (req, res) => {
  const genderDist = await Patient.findAll({
    attributes: ['gender', [fn('COUNT', col('id')), 'count']],
    group: ['gender'],
    raw: true,
  });

  // Age brackets computed in JS (no MongoDB $bucket equivalent needed)
  const patients = await Patient.findAll({ attributes: ['dateOfBirth'], raw: true });
  const ageBrackets = { '0-17': 0, '18-34': 0, '35-49': 0, '50-64': 0, '65+': 0, Unknown: 0 };
  const now = new Date();

  patients.forEach(({ dateOfBirth }) => {
    if (!dateOfBirth) { ageBrackets['Unknown']++; return; }
    const age = Math.floor((now - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 18) ageBrackets['0-17']++;
    else if (age < 35) ageBrackets['18-34']++;
    else if (age < 50) ageBrackets['35-49']++;
    else if (age < 65) ageBrackets['50-64']++;
    else ageBrackets['65+']++;
  });

  const ageDist = Object.entries(ageBrackets).map(([range, count]) => ({ range, count }));

  res.status(200).json({ success: true, data: { genderDist, ageDist } });
});

// @desc    Generate Disease/Symptoms Trends
// @route   GET /api/v1/reports/trends
// @access  Private/Admin/Doctor
exports.getDiseaseTrends = asyncHandler(async (req, res) => {
  // Get top diagnoses from EMR records
  const emrs = await EMR.findAll({
    attributes: ['diagnosis'],
    where: { diagnosis: { [Op.ne]: null } },
    raw: true,
  });

  const counts = {};
  emrs.forEach(({ diagnosis }) => {
    if (!diagnosis) return;
    const d = diagnosis.trim();
    if (d) counts[d] = (counts[d] || 0) + 1;
  });

  const trends = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([diagnosis, count]) => ({ diagnosis, count }));

  res.status(200).json({ success: true, data: trends });
});

// ── EXPORT ENDPOINTS ─────────────────────────────────────────────

// @desc    Export Revenue Report as PDF
// @route   GET /api/v1/reports/export/pdf
// @access  Private/Admin/Cashier
exports.exportRevenuePDF = asyncHandler(async (req, res) => {
  const PDFDocument = require('pdfkit');
  const { startDate, endDate } = req.query;
  const where = { status: 'paid' };

  if (startDate && endDate) {
    where.updatedAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  }

  const [revenueData, totalResult] = await Promise.all([
    Invoice.findAll({
      where,
      attributes: [
        [fn('DATE', col('updatedAt')), 'date'],
        [fn('SUM', col('paidAmount')), 'total'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('DATE', col('updatedAt'))],
      order: [[fn('DATE', col('updatedAt')), 'ASC']],
      raw: true,
    }),
    Invoice.findAll({
      where,
      attributes: [[fn('SUM', col('paidAmount')), 'grandTotal']],
      raw: true,
    }),
  ]);

  const grandTotal = Number(totalResult[0]?.grandTotal || 0);

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="revenue-report-${Date.now()}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(22).fillColor('#1e40af').text('Metro Medi Care', { align: 'center' });
  doc.fontSize(14).fillColor('#374151').text('Revenue Report', { align: 'center' });
  doc.fontSize(10).fillColor('#6b7280').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
  doc.moveDown(1.5);

  // Grand total box
  doc.rect(50, doc.y, 495, 50).fillAndStroke('#f0f9ff', '#bfdbfe');
  doc.fontSize(12).fillColor('#1e40af').text(`Total Revenue: LKR ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 60, doc.y - 35);
  doc.moveDown(2.5);

  // Table header
  const tableTop = doc.y;
  const col1 = 50, col2 = 250, col3 = 370;
  doc.fontSize(10).fillColor('#1f2937').font('Helvetica-Bold');
  doc.text('Date', col1, tableTop);
  doc.text('Transactions', col2, tableTop);
  doc.text('Amount (LKR)', col3, tableTop);
  doc.moveTo(50, tableTop + 16).lineTo(545, tableTop + 16).strokeColor('#d1d5db').stroke();
  doc.moveDown(0.5);

  // Table rows
  doc.font('Helvetica').fontSize(10).fillColor('#374151');
  revenueData.forEach((row, i) => {
    const y = doc.y;
    if (i % 2 === 0) doc.rect(50, y - 3, 495, 18).fillColor('#f9fafb').fill();
    doc.fillColor('#374151').text(String(row.date || '—'), col1, y);
    doc.text(String(row.count || 0), col2, y);
    doc.text(`${Number(row.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, col3, y);
    doc.moveDown(0.4);
  });

  doc.end();
});

// @desc    Export Revenue Report as Excel
// @route   GET /api/v1/reports/export/excel
// @access  Private/Admin/Cashier
exports.exportRevenueExcel = asyncHandler(async (req, res) => {
  const ExcelJS = require('exceljs');
  const { startDate, endDate } = req.query;
  const where = { status: 'paid' };

  if (startDate && endDate) {
    where.updatedAt = { [Op.between]: [new Date(startDate), new Date(endDate)] };
  }

  const revenueData = await Invoice.findAll({
    where,
    attributes: [
      [fn('DATE', col('updatedAt')), 'date'],
      [fn('SUM', col('paidAmount')), 'total'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [fn('DATE', col('updatedAt'))],
    order: [[fn('DATE', col('updatedAt')), 'ASC']],
    raw: true,
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Metro Medi Care PMS';
  const sheet = workbook.addWorksheet('Revenue Report');

  // Title rows
  sheet.mergeCells('A1:C1');
  sheet.getCell('A1').value = 'Metro Medi Care — Revenue Report';
  sheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF1E40AF' } };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  sheet.mergeCells('A2:C2');
  sheet.getCell('A2').value = `Generated: ${new Date().toLocaleString()}`;
  sheet.getCell('A2').font = { size: 10, color: { argb: 'FF6B7280' } };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  sheet.addRow([]);

  // Header row
  const headerRow = sheet.addRow(['Date', 'Transactions', 'Amount (LKR)']);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };
  headerRow.alignment = { horizontal: 'center' };

  // Column widths
  sheet.getColumn('A').width = 20;
  sheet.getColumn('B').width = 18;
  sheet.getColumn('C').width = 20;

  // Data rows
  let grandTotal = 0;
  revenueData.forEach((row, i) => {
    const dataRow = sheet.addRow([
      row.date || '—',
      Number(row.count || 0),
      Number(row.total || 0),
    ]);
    if (i % 2 === 0) {
      dataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
    }
    dataRow.getCell(3).numFmt = '#,##0.00';
    grandTotal += Number(row.total || 0);
  });

  // Total row
  const totalRow = sheet.addRow(['TOTAL', '', grandTotal]);
  totalRow.font = { bold: true };
  totalRow.getCell(3).numFmt = '#,##0.00';
  totalRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="revenue-report-${Date.now()}.xlsx"`);

  await workbook.xlsx.write(res);
  res.end();
});
