const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/verify', paymentController.verifyPaymentWebhook);
router.get('/my-payments', protect, paymentController.getMyPayments);

module.exports = router;
