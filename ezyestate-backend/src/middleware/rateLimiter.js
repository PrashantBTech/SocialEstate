const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

const createLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { success: false, message },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter: createLimiter(
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    parseInt(process.env.RATE_LIMIT_MAX) || 100,
    'Too many requests from this IP. Please try again later.'
  ),
  authLimiter: createLimiter(15 * 60 * 1000, 10, 'Too many auth attempts. Please wait 15 minutes.'),
  otpLimiter: createLimiter(60 * 1000, 3, 'Too many OTP requests. Please wait 1 minute.'),
  uploadLimiter: createLimiter(60 * 60 * 1000, 50, 'Too many uploads. Please try again later.'),
  speedLimiter: slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: () => 500,
  }),
};
