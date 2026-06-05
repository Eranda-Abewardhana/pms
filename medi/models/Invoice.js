const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @description Invoice for patient services — created and managed by cashier.
 * invoiceId is auto-generated (INV-XXXXX).
 */

const invoiceItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['consultation', 'lab', 'medication', 'procedure', 'other'],
      default: 'other',
    },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 }, // quantity * unitPrice
    labTestId: { type: Schema.Types.ObjectId, ref: 'LabTest' } // Optional reference for specific lab test tracking
  },
  { _id: false }
);

const invoiceSchema = new Schema(
  {
    invoiceId: {
      type: String,
      unique: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    appointment: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    labTest: { // Field for tracking a primary lab test link
      type: Schema.Types.ObjectId,
      ref: 'LabTest',
    },
    items: [invoiceItemSchema],
    subtotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },  // percentage
    taxAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'unpaid', 'partial', 'paid', 'cancelled'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'online'],
    },
    transactionId: {
      type: String,
      trim: true,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User', // cashier
    },
    dueDate: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// ── Auto-generate invoiceId ───────────────────────────────────────
invoiceSchema.pre('save', async function () {
  if (!this.isNew) return;
  const count = await mongoose.model('Invoice').countDocuments();
  this.invoiceId = `INV-${String(count + 1).padStart(5, '0')}`;
});

// ── Auto-calculate totals before save ────────────────────────────
invoiceSchema.pre('save', function () {
  this.subtotal = this.items.reduce((sum, item) => sum + item.amount, 0);
  this.taxAmount = parseFloat(((this.subtotal * this.taxRate) / 100).toFixed(2));
  this.totalAmount = parseFloat((this.subtotal + this.taxAmount - this.discount).toFixed(2));
  this.balanceDue = parseFloat((this.totalAmount - this.paidAmount).toFixed(2));

  if (this.paidAmount >= this.totalAmount && this.totalAmount > 0) {
    this.status = 'paid';
    if (!this.paidAt) this.paidAt = new Date();
  } else if (this.paidAmount > 0) {
    this.status = 'partial';
  }
});

invoiceSchema.index({ patient: 1, createdAt: -1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ processedBy: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
