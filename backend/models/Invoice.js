// ================================================================
// INVOICE MODEL — MySQL/Sequelize (replaces Mongoose)
// ================================================================

/* ── COMMENTED OUT: Mongoose Invoice Schema ─────────────────────
... (see git history for original Mongoose schema)
─────────────────────────────────────────────── END MONGOOSE */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Invoice = sequelize.define('Invoice', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  invoiceId: { type: DataTypes.STRING(30), allowNull: true, unique: true },
  patientId:     { type: DataTypes.INTEGER, allowNull: false },
  appointmentId: { type: DataTypes.INTEGER, allowNull: true },
  labTestId:     { type: DataTypes.INTEGER, allowNull: true },
  // Line items stored as JSON array — getter auto-parses MySQL string responses
  items: {
    type: DataTypes.JSON, allowNull: true, defaultValue: [],
    get() { const v = this.getDataValue('items'); return typeof v === 'string' ? JSON.parse(v) : (v ?? []); },
  },
  subtotal:      { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  taxRate:       { type: DataTypes.DECIMAL(5,2),  defaultValue: 0 },
  taxAmount:     { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  discount:      { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  totalAmount:   { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  paidAmount:    { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  balanceDue:    { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('draft','unpaid','partial','paid','cancelled'),
    defaultValue: 'unpaid',
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash','card','bank_transfer','online'),
    allowNull: true,
  },
  transactionId: { type: DataTypes.STRING(100), allowNull: true },
  processedBy:   { type: DataTypes.INTEGER, allowNull: true }, // FK → users.id
  dueDate:       { type: DataTypes.DATEONLY, allowNull: true },
  paidAt:        { type: DataTypes.DATE,    allowNull: true },
  notes:         { type: DataTypes.STRING(500), allowNull: true },
}, { tableName: 'invoices', timestamps: true });

// Auto-generate invoiceId
Invoice.beforeCreate(async (invoice) => {
  const count = await Invoice.count();
  invoice.invoiceId = `INV-${String(count + 1).padStart(5, '0')}`;
});

// Auto-calculate totals
Invoice.beforeSave((invoice) => {
  if (!invoice.items || !invoice.items.length) return;
  const subtotal    = invoice.items.reduce((s, i) => s + (i.amount || 0), 0);
  const taxAmount   = parseFloat(((subtotal * (invoice.taxRate || 0)) / 100).toFixed(2));
  const totalAmount = parseFloat((subtotal + taxAmount - (invoice.discount || 0)).toFixed(2));
  const balanceDue  = parseFloat((totalAmount - (invoice.paidAmount || 0)).toFixed(2));
  invoice.subtotal    = subtotal;
  invoice.taxAmount   = taxAmount;
  invoice.totalAmount = totalAmount;
  invoice.balanceDue  = balanceDue;
  if (invoice.paidAmount >= totalAmount && totalAmount > 0) {
    invoice.status = 'paid';
    if (!invoice.paidAt) invoice.paidAt = new Date();
  } else if (invoice.paidAmount > 0) {
    invoice.status = 'partial';
  }
});

module.exports = Invoice;
