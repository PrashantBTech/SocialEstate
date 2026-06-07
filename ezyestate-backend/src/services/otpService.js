const crypto = require('crypto');
const OTP = require('../models/OTP');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// In production use Twilio; dev mode returns OTP in response
const generateOTP = () => {
  if (process.env.NODE_ENV === 'test') return '123456';
  return crypto.randomInt(100000, 999999).toString();
};

const sendOTPviaSMS = async (mobile, otp) => {
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
    logger.info(`[DEV] OTP for ${mobile}: ${otp}`);
    return { sid: 'dev-mock' };
  }
  try {
    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const msg = await twilio.messages.create({
      body: `Your EzyEstate OTP is ${otp}. Valid for ${process.env.OTP_EXPIRE_MINUTES || 10} minutes. Do not share with anyone.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${mobile}`,
    });
    return msg;
  } catch (err) {
    logger.error(`SMS send failed: ${err.message}`);
    throw new AppError('Failed to send OTP. Please try again.', 500);
  }
};

const createAndSendOTP = async (mobile, purpose) => {
  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS) || 5;

  // Check recent OTPs to prevent flooding
  const recentCount = await OTP.countDocuments({
    mobile,
    purpose,
    createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // last hour
  });

  if (recentCount >= maxAttempts) {
    throw new AppError('Too many OTP requests. Please try again after an hour.', 429);
  }

  // Invalidate previous OTPs
  await OTP.updateMany({ mobile, purpose, isUsed: false }, { isUsed: true });

  const otp = generateOTP();
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  await OTP.create({ mobile, otp: hashedOTP, purpose });
  await sendOTPviaSMS(mobile, otp);

  return process.env.NODE_ENV === 'development' ? otp : undefined;
};

const verifyOTP = async (mobile, otp, purpose) => {
  const hashedOTP = crypto.createHash('sha256').update(otp).digest('hex');

  const record = await OTP.findOne({
    mobile,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!record) {
    throw new AppError('OTP is invalid or has expired.', 400);
  }

  if (record.attempts >= 3) {
    await record.updateOne({ isUsed: true });
    throw new AppError('Too many wrong attempts. Please request a new OTP.', 400);
  }

  if (record.otp !== hashedOTP) {
    await record.updateOne({ $inc: { attempts: 1 } });
    throw new AppError('Incorrect OTP. Please try again.', 400);
  }

  await record.updateOne({ isUsed: true });
  return true;
};

module.exports = { createAndSendOTP, verifyOTP };
