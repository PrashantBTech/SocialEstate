const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  avatar: String,
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
  },
  password: {
    type: String,
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['owner', 'builder', 'buyer', 'admin', 'superadmin'],
    required: true,
  },
  isMobileVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isBlocked: { type: Boolean, default: false },
  blockedReason: String,

  // Location default for feed priority
  location: {
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
  },

  // Buyer preferences
  preferences: {
    lookingFor: [{
      type: String,
      enum: ['residential', 'land', 'builder_project', 'commercial'],
    }],
    budgetMin: Number,
    budgetMax: Number,
    bhkPreference: [String],
    notificationChannels: {
      whatsapp: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
    },
  },

  // CRM Tags (set by admin team)
  crmTag: {
    type: String,
    enum: ['hot_lead', 'warm', 'cold', 'contacted', 'not_interested', 'converted'],
  },
  crmNotes: [{
    note: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
  }],

  // Builder-specific fields
  builderProfile: {
    companyName: String,
    designation: String,
    companyAddress: String,
    totalProjectsCompleted: { type: Number, default: 0 },
    logo: String, // Cloudinary URL
    bio: String,
    isVerified: { type: Boolean, default: false },
  },

  shortlistedListings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Listing' }],
  shortlistedProjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],

  refreshToken: { type: String, select: false },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ 'location.coordinates': '2dsphere' });
userSchema.index({ crmTag: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Compare passwords
userSchema.methods.correctPassword = async function (candidate, hashed) {
  return bcrypt.compare(candidate, hashed);
};

// Account lockout check
userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 }; // 15 min
  }
  return this.updateOne(updates);
};

module.exports = mongoose.model('User', userSchema);
