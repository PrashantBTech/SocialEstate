const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

let razorpay;
const getRazorpay = () => {
  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

const createOrder = async ({ userId, amount, type, listingId, projectId, metadata = {} }) => {
  const amountPaise = amount * 100; // Razorpay uses paise

  const payment = await Payment.create({
    user: userId,
    listing: listingId,
    project: projectId,
    type,
    amount: amountPaise,
    status: 'created',
    metadata,
  });

  if (process.env.NODE_ENV === 'test' || !process.env.RAZORPAY_KEY_ID) {
    const mockOrder = { id: `order_mock_${Date.now()}`, amount: amountPaise, currency: 'INR' };
    await Payment.findByIdAndUpdate(payment._id, { razorpayOrderId: mockOrder.id });
    return { order: mockOrder, paymentId: payment._id };
  }

  const order = await getRazorpay().orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: payment._id.toString(),
    notes: { type, userId: userId.toString() },
  });

  await Payment.findByIdAndUpdate(payment._id, { razorpayOrderId: order.id });

  return { order, paymentId: payment._id };
};

const verifyPayment = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dev_secret')
    .update(body)
    .digest('hex');

  if (process.env.NODE_ENV !== 'test' && expectedSignature !== razorpaySignature) {
    throw new AppError('Payment verification failed. Invalid signature.', 400);
  }

  const payment = await Payment.findOneAndUpdate(
    { razorpayOrderId },
    { razorpayPaymentId, razorpaySignature, status: 'paid' },
    { new: true }
  );

  if (!payment) throw new AppError('Payment record not found.', 404);

  logger.info(`Payment verified: ${razorpayPaymentId} for ${payment.type}`);
  return payment;
};

module.exports = { createOrder, verifyPayment };
