const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

  type: {
    type: String,
    enum: ['service_fee', 'commission', 'renewal_fee', 'boost_fee'],
    required: true,
  },

  amount: { type: Number, required: true }, // in paise for Razorpay
  currency: { type: String, default: 'INR' },

  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: { type: String, index: true },
  razorpaySignature: String,

  status: {
    type: String,
    enum: ['created', 'paid', 'failed', 'refunded'],
    default: 'created',
  },

  refundId: String,
  refundAmount: Number,
  refundReason: String,
  refundedAt: Date,

  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
