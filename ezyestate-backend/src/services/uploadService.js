const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.AWS_BUCKET_NAME;
const USE_S3 = !!(process.env.AWS_ACCESS_KEY_ID && BUCKET);

// Local storage fallback (dev mode)
const localStorageFallback = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const s3Storage = USE_S3 ? multerS3({
  s3,
  bucket: BUCKET,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const folder = req.uploadFolder || 'misc';
    const ext = path.extname(file.originalname);
    cb(null, `${folder}/${uuidv4()}${ext}`);
  },
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname, uploadedBy: req.user?._id?.toString() || 'anonymous' });
  },
}) : null;

const fileFilter = (allowedTypes) => (req, file, cb) => {
  const allowed = {
    images: ['image/jpeg', 'image/png', 'image/webp'],
    pdf: ['application/pdf'],
    video: ['video/mp4', 'video/quicktime'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  };

  const allowedMimes = allowedTypes.flatMap((t) => allowed[t] || []);
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type not allowed. Accepted: ${allowedTypes.join(', ')}`, 400), false);
  }
};

// Property photos uploader (up to 10 images)
exports.uploadPropertyPhotos = multer({
  storage: USE_S3 ? s3Storage : localStorageFallback,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 }, // 10MB per file, 10 files
  fileFilter: fileFilter(['images']),
}).array('photos', 10);

// Single file uploader (brochure PDF, avatar, logo)
exports.uploadSingleFile = (fieldName, folder = 'misc', types = ['images', 'pdf']) => {
  return multer({
    storage: USE_S3 ? s3Storage : localStorageFallback,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: fileFilter(types),
  }).single(fieldName);
};

// Process image with Sharp (resize + optimize)
exports.processImage = async (inputBuffer, options = {}) => {
  const {
    width = 1200,
    height = 800,
    quality = 80,
    format = 'jpeg',
    generateThumbnail = true,
    thumbnailWidth = 400,
    thumbnailHeight = 300,
  } = options;

  const image = sharp(inputBuffer).resize(width, height, { fit: 'inside', withoutEnlargement: true });

  let processed;
  if (format === 'webp') {
    processed = await image.webp({ quality }).toBuffer();
  } else {
    processed = await image.jpeg({ quality, progressive: true }).toBuffer();
  }

  let thumbnail = null;
  if (generateThumbnail) {
    thumbnail = await sharp(inputBuffer)
      .resize(thumbnailWidth, thumbnailHeight, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();
  }

  return { processed, thumbnail };
};

// Get S3 URL
exports.getFileUrl = (key) => {
  if (!key) return null;
  if (key.startsWith('http')) return key; // Already a full URL
  if (USE_S3) return `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  
  // Local fallback
  // `key` is like `uploads/users/uuid.png` or `uuid.png`
  // Make sure we format it correctly so it resolves to `/uploads/xyz`
  const sanitizedKey = key.replace(/\\/g, '/');
  if (sanitizedKey.startsWith('uploads/')) {
    return `${process.env.BACKEND_URL || 'http://localhost:5000'}/${sanitizedKey}`;
  }
  return `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${sanitizedKey}`;
};

// Delete S3 file
exports.deleteFile = async (key) => {
  if (!key || !USE_S3) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    logger.error(`S3 delete failed for ${key}: ${err.message}`);
  }
};

// Middleware to set upload folder from route
exports.setUploadFolder = (folder) => (req, res, next) => {
  req.uploadFolder = folder;
  next();
};
