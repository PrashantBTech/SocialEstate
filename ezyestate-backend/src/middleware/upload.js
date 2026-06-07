const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/AppError');

const createStorage = (folder, allowedFormats, transformations = []) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `ezyestate/${folder}`,
      allowed_formats: allowedFormats,
      transformation: transformations,
    },
  });

const fileFilter = (allowed) => (req, file, cb) => {
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type not allowed. Allowed: ${allowed.join(', ')}`, 400), false);
  }
};

// Wrap multer middleware so that upload errors (including Cloudinary stream
// failures) are caught and forwarded to Express error handling instead of
// throwing an unhandled promise rejection that crashes the server.
const wrapMulter = (multerMiddleware) => (req, res, next) => {
  multerMiddleware(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // Multer-specific errors (file too large, too many files, etc.)
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('File too large. Maximum size is 10MB.', 400));
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new AppError('Too many files uploaded.', 400));
        }
        return next(new AppError(`Upload error: ${err.message}`, 400));
      }
      // Cloudinary or other errors
      if (err.isOperational) return next(err);
      return next(new AppError(`Photo upload failed: ${err.message || 'Unknown error'}. Please try again.`, 500));
    }
    next();
  });
};

// Property photos
const photoStorage = createStorage('listings', ['jpg', 'jpeg', 'png', 'webp'], [
  { width: 1200, height: 900, crop: 'limit', quality: 'auto' },
]);

const uploadListingPhotos = wrapMulter(
  multer({
    storage: photoStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
  }).array('photos', 10)
);

// Builder logo / project images
const builderImageStorage = createStorage('builders', ['jpg', 'jpeg', 'png', 'webp'], [
  { width: 800, height: 600, crop: 'limit', quality: 'auto' },
]);

const uploadBuilderImages = wrapMulter(
  multer({
    storage: builderImageStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
  }).fields([
    { name: 'logo', maxCount: 1 },
    { name: 'images', maxCount: 20 },
    { name: 'bannerImage', maxCount: 1 },
  ])
);

// Brochure PDF
const brochureStorage = createStorage('brochures', ['pdf']);
const uploadBrochure = wrapMulter(
  multer({
    storage: brochureStorage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: fileFilter(['application/pdf']),
  }).single('brochure')
);

// Floor plans
const floorPlanStorage = createStorage('floor_plans', ['jpg', 'jpeg', 'png', 'pdf', 'webp']);
const uploadFloorPlans = wrapMulter(
  multer({
    storage: floorPlanStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
  }).array('floorPlans', 10)
);

// Avatar photos
const avatarStorage = createStorage('avatars', ['jpg', 'jpeg', 'png', 'webp'], [
  { width: 400, height: 400, crop: 'fill', quality: 'auto' },
]);
const uploadAvatarMiddleware = wrapMulter(
  multer({
    storage: avatarStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter(['image/jpeg', 'image/png', 'image/webp']),
  }).single('avatar')
);

module.exports = { uploadListingPhotos, uploadBuilderImages, uploadBrochure, uploadFloorPlans, uploadAvatarMiddleware };

