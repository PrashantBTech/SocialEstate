const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Either listing or project
  listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  unitType: String, // For project enquiries

  // Contact snapshot (in case user data changes)
  buyerSnapshot: {
    name: String,
    mobile: String,
    email: String,
  },

  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'site_visit_scheduled', 'deal_in_progress', 'closed_won', 'closed_lost', 'unresponsive'],
    default: 'new',
    index: true,
  },
  
  // Team CRM actions
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin user
  
  callLogs: [{
    calledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    calledAt: { type: Date, default: Date.now },
    duration: Number, // seconds
    outcome: {
      type: String,
      enum: ['answered', 'not_answered', 'busy', 'wrong_number', 'callback_requested'],
    },
    notes: String,
    followUpDate: Date,
  }],

  siteVisit: {
    scheduledAt: Date,
    confirmedBySeller: Boolean,
    confirmedByBuyer: Boolean,
    outcome: { type: String, enum: ['completed', 'cancelled', 'rescheduled', 'no_show'] },
    notes: String,
  },

  // Admin notes
  notes: String,
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  
  source: { type: String, enum: ['platform', 'whatsapp', 'phone', 'social'], default: 'platform' },
  
  nextFollowUp: { type: Date, index: true },
  closedAt: Date,
  closedReason: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

enquirySchema.index({ buyer: 1, listing: 1 }, { unique: true, sparse: true });
enquirySchema.index({ buyer: 1, project: 1 }, { unique: true, sparse: true });
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ listing: 1 });
enquirySchema.index({ project: 1 });
enquirySchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
