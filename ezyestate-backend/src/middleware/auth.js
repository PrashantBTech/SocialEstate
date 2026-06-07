const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');


const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE });

const createSendToken = async (user, statusCode, res) => {
  const token = signToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Store refresh token hash in DB
  user.refreshToken = require('crypto').createHash('sha256').update(refreshToken).digest('hex');
  await user.save({ validateBeforeSave: false });

  await user.populate('shortlistedListings', 'propertyType location askingPrice photos status intent isFeatured bedrooms totalArea possessionStatus');
  await user.populate('shortlistedProjects', 'projectName location.city projectStatus');

  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('refreshToken', refreshToken, cookieOptions);

  user.password = undefined;
  user.refreshToken = undefined;

  return res.status(statusCode).json({
    success: true,
    token,
    data: { user },
  });
};

// Protect middleware
const protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) return next(new AppError('You are not logged in. Please log in.', 401));

  // Check blacklist
  try {
    const cacheService = require('../services/cacheService');
    const isBlacklisted = await cacheService.get(`bl:${token}`);
    if (isBlacklisted) return next(new AppError('Token has been invalidated. Please log in again.', 401));
  } catch (_) { /* Cache service fallback failure — continue */ }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id).select('+password');
  if (!user) return next(new AppError('The user no longer exists.', 401));
  if (user.isBlocked) return next(new AppError(`Account suspended: ${user.blockedReason || 'Contact support'}`, 403));
  if (!user.isMobileVerified) return next(new AppError('Please verify your mobile number first.', 403));

  if (user.passwordChangedAt) {
    const changedTimestamp = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
    if (decoded.iat < changedTimestamp) return next(new AppError('Password was recently changed. Please log in again.', 401));
  }

  req.user = user;
  next();
});

// Role restriction
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to perform this action.', 403));
  }
  next();
};

// Optional auth (for public routes that can optionally identify user)
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && !user.isBlocked) req.user = user;
    }
  } catch (_) { /* pass */ }
  next();
};

module.exports = { protect, restrictTo, optionalAuth, createSendToken, signToken };
