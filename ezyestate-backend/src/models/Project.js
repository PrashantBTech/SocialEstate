const mongoose = require('mongoose');
const slugify = require('slugify');

const unitTypeSchema = new mongoose.Schema({
  bhkType: { type: String, required: true }, // e.g. '2 BHK', '3 BHK', 'Plot'
  sizeMin: Number,
  sizeMax: Number,
  startingPrice: Number,
  availableUnits: Number,
  totalUnits: Number,
  possessionDate: Date,
  floorPlans: [{ url: String, publicId: String, label: String }],
});

const projectSchema = new mongoose.Schema({
  builder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Step 1 — Company (denormalized for speed)
  companyName: { type: String, required: true },
  builderLogo: String,
  totalProjectsCompleted: { type: Number, default: 0 },

  // Step 2 — Project Basic Info
  projectName: { type: String, required: true },
  projectType: {
    type: String,
    enum: ['apartments', 'villas', 'plotted', 'mixed', 'commercial'],
    required: true,
  },
  projectStatus: {
    type: String,
    enum: ['new_launch', 'under_construction', 'ready'],
    required: true,
  },
  totalProjectArea: { value: Number, unit: { type: String, default: 'acres' } },
  totalUnits: Number,
  availableUnits: Number,
  expectedPossessionDate: Date,
  reraNumber: {
    type: String,
    trim: true,
  },
  brochure: { url: String, publicId: String },

  // Step 3 — Location
  location: {
    state: { type: String, required: true },
    city: { type: String, required: true },
    locality: String,
    pincode: String,
    siteAddress: String,
    distanceFromCenter: String,
    nearbyLandmarks: String,
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], index: '2dsphere' },
    },
  },

  // Step 4 — Unit Types
  unitTypes: [unitTypeSchema],

  // Gallery
  images: [{ url: String, publicId: String, caption: String }],
  bannerImage: String,

  // Amenities
  amenities: [{
    name: String,
    icon: String,
  }],

  // Platform fields
  slug: { type: String, unique: true },
  status: {
    type: String,
    enum: ['pending_review', 'active', 'rejected', 'completed', 'archived'],
    default: 'pending_review',
    index: true,
  },
  rejectionReason: String,
  isVerified: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isPromoted: { type: Boolean, default: false },

  // Payment
  serviceFee: {
    amount: { type: Number, default: 15000 },
    paymentId: String,
    paidAt: Date,
    status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  },
  perUnitCommission: {
    amount: Number,
    agreedInWriting: { type: Boolean, default: false },
    agreementDate: Date,
  },

  listedAt: Date,
  views: { type: Number, default: 0 },
  enquiryCount: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

projectSchema.index({ 'location.city': 1, status: 1 });
projectSchema.index({ 'location.coordinates': '2dsphere' });
projectSchema.index({ projectStatus: 1 });
projectSchema.index({ isFeatured: -1, createdAt: -1 });
projectSchema.index({
  projectName: 'text',
  'location.city': 'text',
  'location.locality': 'text',
  companyName: 'text',
});

projectSchema.pre('save', function (next) {
  if (this.isNew) {
    this.slug = slugify(`${this.projectName}-${this.location.city}`, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
