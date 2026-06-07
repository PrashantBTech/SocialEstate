const Payment = require('../models/Payment');
const Listing = require('../models/Listing');
const Project = require('../models/Project');
const { verifyPayment } = require('../services/paymentService');
const { notify } = require('../services/notificationService');
const { sendEmail, templates } = require('../services/emailService');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const apiRes = require('../utils/apiResponse');

// POST /payments/verify
exports.verifyPaymentWebhook = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const payment = await verifyPayment({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
  });

  // Update related listing/project
  if (payment.listing) {
    const listing = await Listing.findById(payment.listing);
    if (listing) {
      listing.serviceFee.status = 'paid';
      listing.serviceFee.paidAt = new Date();
      listing.serviceFee.paymentId = razorpay_payment_id;
      // Don't auto-approve; team reviews first
      await listing.save();
    }
  }

  if (payment.project) {
    const project = await Project.findById(payment.project);
    if (project) {
      project.serviceFee.status = 'paid';
      project.serviceFee.paidAt = new Date();
      project.serviceFee.paymentId = razorpay_payment_id;
      await project.save();
    }
  }

  await notify({
    recipientId: payment.user,
    type: 'payment_success',
    title: 'Payment Successful',
    message: `Your payment of ₹${(payment.amount / 100).toLocaleString()} has been received.`,
    channels: { whatsapp: true, email: true },
  });

  apiRes.success(res, 'Payment verified successfully.', { payment });
});

// GET /payments/my-payments
exports.getMyPayments = catchAsync(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate('listing', 'propertyType location.city')
    .populate('project', 'projectName location.city')
    .sort({ createdAt: -1 });

  apiRes.success(res, 'Your payments fetched.', { payments });
});
