const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/send-otp', otpLimiter, authController.sendOTP);
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', protect, authController.logout);

const { uploadAvatarMiddleware } = require('../middleware/upload');

router.get('/me', protect, authController.getMe);
router.patch('/update-profile', protect, authController.updateProfile);
router.post('/verify-update-mobile', protect, authController.verifyUpdateMobile);
router.patch('/change-password', protect, authController.changePassword);
router.patch('/upload-avatar', protect, uploadAvatarMiddleware, authController.uploadAvatar);

module.exports = router;
