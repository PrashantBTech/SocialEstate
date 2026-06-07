const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['register', 'login', 'reset_password', 'verify_buyer', 'update-mobile'],
    required: true,
  },
  attempts: { type: Number, default: 0 },
  isUsed: { type: Boolean, default: false },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + parseInt(process.env.OTP_EXPIRE_MINUTES || 10) * 60 * 1000),
    index: { expireAfterSeconds: 0 },
  },
}, { timestamps: true });

otpSchema.index({ mobile: 1, purpose: 1 });

module.exports = mongoose.model('OTP', otpSchema);
