const mongoose = require('mongoose');
const slugify = require('slugify');

const listingSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Step 1 — Basic Details
  intent: { type: String, enum: ['sell', 'rent'], default: 'sell' },
  propertyCategory: { type: String, enum: ['residential', 'commercial'], required: true },
  propertyType: {
    type: String,
    enum: ['flat', 'house', 'builder_floor', 'plot', '1rk', 'farmhouse', 'shop', 'office', 'warehouse', 'other'],
    required: true,
  },
  askingPrice: { type: Number, required: true, min: 0 },
  isPriceNegotiable: { type: Boolean, default: false },
  possessionStatus: { type: String, enum: ['ready', 'under_construction', 'new'], required: true },

  // Step 2 — Location
  location: {
    state: { type: String, required: true },
    city: { type: String, required: true },
    locality: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: String,
    flatNo: String, // Hidden from buyers until team approves
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] }, // [lng, lat]
    },
  },

  // Step 3 — Property Profile
  totalArea: { value: Number, unit: { type: String, enum: ['sqft', 'sqyd', 'marla', 'biswa', 'acres', 'bigha'] } },
  builtupArea: { value: Number, unit: String },
  bedrooms: { type: String, enum: ['1bhk', '2bhk', '3bhk', '4bhk+', 'na'] },
  bathrooms: { type: Number, min: 1, max: 10 },
  floors: String,
  totalFloorsInBuilding: Number,
  facing: { type: String, enum: ['east', 'west', 'north', 'south', 'corner'] },
  roadWidth: Number, // feet
  propertyAge: { type: String, enum: ['new', 'lt5', '5to10', '10to20', '20plus'] },
  description: { type: String, minlength: 50, maxlength: 500 },
  ownershipType: { type: String, enum: ['freehold', 'leasehold', 'cooperative'] },
  documentsAvailable: [{
    type: String,
    enum: ['registry', 'noc', 'mutation', 'map', 'rera', 'other'],
  }],

  // Step 4 — Photos & Videos
  photos: [{
    url: { type: String, required: true },
    publicId: String,
    caption: String,
  }],
  video: { url: String, type: { type: String, enum: ['upload', 'youtube', 'gdrive'] } },
  voiceNote: String,

  // Step 5 — Amenities
  amenities: {
    parking: { available: Boolean, type: { type: String, enum: ['car', 'two_wheeler', 'both'] } },
    powerBackup: { type: String, enum: ['yes', 'no', 'partial'] },
    waterSupply: { type: String, enum: ['municipal', 'borewell', 'both'] },
    isGatedSociety: Boolean,
    loanAvailable: { type: String, enum: ['yes', 'no', 'not_sure'] },
    nearbyLandmarks: String,
    additionalInfo: String,
    preferredContactTime: { type: String, enum: ['morning', 'afternoon', 'evening', 'anytime'] },
  },

  // Platform & Admin fields
  slug: { type: String, unique: true },
  status: {
    type: String,
    enum: ['pending_review', 'active', 'rejected', 'expired', 'sold', 'archived'],
    default: 'pending_review',
    index: true,
  },
  proposedEdits: { type: mongoose.Schema.Types.Mixed },
  editStatus: { type: String, enum: ['none', 'pending', 'rejected'], default: 'none' },
  rejectionReason: String,
  isVerified: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false, index: true },
  isPromoted: { type: Boolean, default: false },

  propertyScore: { type: Number, default: 0, min: 0, max: 100 },

  // Listing lifecycle
  listedAt: Date, // Date when team approved & went live
  expiresAt: Date, // listedAt + 90 days
  renewedAt: Date,

  // Payment
  serviceFee: {
    amount: { type: Number, default: 15000 },
    paymentId: String,
    paidAt: Date,
    status: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
  },

  // Metrics
  views: { type: Number, default: 0 },
  enquiryCount: { type: Number, default: 0 },
  promotedOn: [{ platform: String, date: Date }],

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for fast queries
listingSchema.index({ 'location.city': 1, status: 1 });
listingSchema.index({ 'location.pincode': 1 });
listingSchema.index({ 'location.coordinates': '2dsphere' });
listingSchema.index({ propertyType: 1, status: 1 });
listingSchema.index({ askingPrice: 1 });
listingSchema.index({ propertyScore: -1 });
listingSchema.index({ isFeatured: -1, propertyScore: -1 });
listingSchema.index({ createdAt: -1 });
listingSchema.index({ expiresAt: 1 });

// Text search index
listingSchema.index({
  'location.city': 'text',
  'location.locality': 'text',
  description: 'text',
  'location.landmark': 'text',
});

// Auto-generate slug
listingSchema.pre('save', function (next) {
  if (this.isNew || this.isModified('propertyType')) {
    const base = `${this.propertyType}-${this.location.city}-${this.location.locality}`;
    this.slug = slugify(base, { lower: true, strict: true }) + '-' + Date.now();
  }
  next();
});

// Calculate property score
listingSchema.methods.calculateScore = function () {
  let score = 0;
  if (this.photos && this.photos.length > 0) score += 30;
  if (this.description) score += 15;
  if (this.video) score += 10;
  if (this.location.coordinates && this.location.coordinates.coordinates && this.location.coordinates.coordinates[0] !== 0) score += 10;
  if (this.documentsAvailable && this.documentsAvailable.length > 0) score += 15;
  if (this.amenities) score += 10;
  if (this.isVerified) score += 10;
  this.propertyScore = score;
};

module.exports = mongoose.model('Listing', listingSchema);
