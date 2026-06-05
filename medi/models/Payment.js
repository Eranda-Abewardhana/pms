const mongoose = require('mongoose');
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    paymentId: {
      type: String,
      unique: true,
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    items: [
      {
        description: String,
        amount: Number,
      },
    ],
    subtotal: Number,
    discount: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalAmount: Number,
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'bank_transfer', 'online', null],
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'partially_paid', 'cancelled'],
      default: 'pending',
    },
    transactionId: String,
    receiptNumber: String,
    paidAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
