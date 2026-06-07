const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const { createAndSendOTP, verifyOTP } = require('../services/otpService');
const { createSendToken } = require('../middleware/auth');

const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const apiRes = require('../utils/apiResponse');

// POST /auth/send-otp
exports.sendOTP = catchAsync(async (req, res) => {
  const { mobile, purpose } = req.body;
  const devOtp = await createAndSendOTP(mobile, purpose || 'login');
  apiRes.success(res, 'OTP sent successfully.', devOtp ? { devOtp } : {});
});

// POST /auth/register
exports.register = catchAsync(async (req, res, next) => {
  const { mobile, otp, fullName, email, password, role, city, state, pincode } = req.body;
  await verifyOTP(mobile, otp, 'register');
  const existingUser = await User.findOne({ mobile });
  if (existingUser) return next(new AppError('Mobile number is already registered.', 400));
  const user = await User.create({
    fullName, mobile, email, password,
    role: role || 'buyer',
    isMobileVerified: true,
    location: { city, state, pincode },
  });
  await createSendToken(user, 201, res);
});

// POST /auth/login
exports.login = catchAsync(async (req, res, next) => {
  const { mobile, otp, password } = req.body;
  if (!mobile) return next(new AppError('Mobile number is required.', 400));
  const user = await User.findOne({ mobile }).select('+password +refreshToken');
  if (!user) return next(new AppError('No account found with this mobile number.', 404));
  if (user.isBlocked) return next(new AppError('Account suspended. Contact support.', 403));
  if (user.isLocked()) return next(new AppError('Account temporarily locked. Please try in 15 minutes.', 429));
  if (otp) {
    await verifyOTP(mobile, otp, 'login');
    if (!user.isMobileVerified) user.isMobileVerified = true;
  } else if (password) {
    if (!user.password) return next(new AppError('Password not set. Please use OTP login.', 400));
    const correct = await user.correctPassword(password, user.password);
    if (!correct) {
      await user.incrementLoginAttempts();
      return next(new AppError('Incorrect password.', 401));
    }
  } else {
    return next(new AppError('Please provide OTP or password.', 400));
  }
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  await createSendToken(user, 200, res);
});

// POST /auth/refresh-token
exports.refreshToken = catchAsync(async (req, res, next) => {
  const incomingRefresh = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefresh) return next(new AppError('No refresh token provided.', 401));
  const decoded = await promisify(jwt.verify)(incomingRefresh, process.env.JWT_REFRESH_SECRET)
    .catch(() => { throw new AppError('Invalid or expired refresh token.', 401); });
  const hashedToken = crypto.createHash('sha256').update(incomingRefresh).digest('hex');
  const user = await User.findOne({ _id: decoded.id, refreshToken: hashedToken });
  if (!user) return next(new AppError('Refresh token is invalid or revoked.', 401));
  await createSendToken(user, 200, res);
});

// POST /auth/logout
exports.logout = catchAsync(async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.decode(token);
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        const cacheService = require('../services/cacheService');
        await cacheService.set(`bl:${token}`, '1', ttl);
      }
    } catch (_) {}
  }
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });
  res.clearCookie('refreshToken');
  apiRes.success(res, 'Logged out successfully.');
});

// GET /auth/me
exports.getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('shortlistedListings', 'propertyType location askingPrice photos status intent isFeatured bedrooms totalArea possessionStatus')
    .populate('shortlistedProjects', 'projectName location.city projectStatus');
  apiRes.success(res, 'User profile fetched.', { user });
});

// PATCH /auth/update-profile
exports.updateProfile = catchAsync(async (req, res) => {
  const allowed = ['fullName', 'email', 'preferences', 'location', 'builderProfile'];
  const updates = {};
  allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    .populate('shortlistedListings', 'propertyType location askingPrice photos status intent isFeatured bedrooms totalArea possessionStatus')
    .populate('shortlistedProjects', 'projectName location.city projectStatus');
  apiRes.success(res, 'Profile updated.', { user });
});

// PATCH /auth/change-password
exports.changePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!await user.correctPassword(req.body.currentPassword, user.password)) {
    return next(new AppError('Current password is incorrect.', 400));
  }
  user.password = req.body.newPassword;
  await user.save();
  await createSendToken(user, 200, res);
});

// POST /auth/verify-update-mobile
exports.verifyUpdateMobile = catchAsync(async (req, res, next) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) return next(new AppError('Mobile and OTP required.', 400));
  
  // Verify OTP
  await verifyOTP(mobile, otp, 'update-mobile');
  
  // Check if mobile already exists for ANOTHER user
  const existing = await User.findOne({ mobile, _id: { $ne: req.user._id } });
  if (existing) return next(new AppError('Mobile number is already associated with another account.', 400));
  
  // Update mobile
  const user = await User.findByIdAndUpdate(req.user._id, { mobile }, { new: true })
    .populate('shortlistedListings', 'propertyType location askingPrice photos status intent isFeatured bedrooms totalArea possessionStatus')
    .populate('shortlistedProjects', 'projectName location.city projectStatus');
  apiRes.success(res, 'Mobile number updated successfully.', { user });
});

// PATCH /auth/upload-avatar
exports.uploadAvatar = catchAsync(async (req, res, next) => {
  if (!req.file) return next(new AppError('No image uploaded.', 400));
  const avatarUrl = req.file.path; // Cloudinary URL
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: avatarUrl }, { new: true })
    .populate('shortlistedListings', 'propertyType location askingPrice photos status intent isFeatured bedrooms totalArea possessionStatus')
    .populate('shortlistedProjects', 'projectName location.city projectStatus');
  apiRes.success(res, 'Avatar uploaded.', { user });
});
