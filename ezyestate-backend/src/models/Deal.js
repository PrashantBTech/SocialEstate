const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  enquiry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
    required: true,
  },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // owner or builder
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

  stage: {
    type: String,
    enum: ['lead_received', 'contacted', 'site_visit_scheduled', 'deal_in_progress', 'closed_won', 'closed_lost'],
    default: 'lead_received',
    index: true,
  },

  dealValue: { type: Number }, // Final agreed price
  commissionRate: { type: Number, min: 1, max: 10 }, // Percentage
  commissionAmount: Number, // Auto-calculated

  // Payment tracking
  commissionStatus: {
    type: String,
    enum: ['pending', 'invoiced', 'paid', 'disputed'],
    default: 'pending',
  },
  invoiceId: String,
  invoiceDate: Date,
  paidAt: Date,

  notes: [{ 
    text: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
  }],

  closedAt: Date,
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Auto-calculate commission
dealSchema.pre('save', function (next) {
  if (this.dealValue && this.commissionRate) {
    this.commissionAmount = Math.round((this.dealValue * this.commissionRate) / 100);
  }
  next();
});

dealSchema.index({ stage: 1, createdAt: -1 });
dealSchema.index({ managedBy: 1 });
dealSchema.index({ commissionStatus: 1 });

module.exports = mongoose.model('Deal', dealSchema);
