const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: [
      'listing_approved', 'listing_rejected', 'listing_expired', 'listing_expiring_soon',
      'new_enquiry', 'enquiry_update', 'deal_update', 'payment_success', 'payment_failed',
      'new_matching_listing', 'team_contacted', 'site_visit_scheduled',
      'admin_message'
    ],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed, // Extra context (listingId, enquiryId etc)
  isRead: { type: Boolean, default: false, index: true },
  channels: {
    inApp: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
  },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
