const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema(
  {
    calledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    calledUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    calledPhone: String, // If calling non-registered number

    // Context
    enquiry: { type: mongoose.Schema.Types.ObjectId, ref: 'Enquiry', index: true },
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

    // Call details
    callType: {
      type: String,
      enum: ['outbound_buyer', 'outbound_seller', 'outbound_builder', 'inbound'],
      required: true,
    },
    duration: Number, // In seconds
    outcome: {
      type: String,
      enum: ['answered', 'not_answered', 'busy', 'voicemail', 'wrong_number'],
      required: true,
    },
    notes: String,

    // Follow-up
    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date, index: true },
    followUpCompleted: { type: Boolean, default: false },
    followUpCompletedAt: Date,
  },
  { timestamps: true }
);

callLogSchema.index({ calledBy: 1, createdAt: -1 });
callLogSchema.index({ followUpDate: 1, followUpCompleted: 1 });
callLogSchema.index({ enquiry: 1 });

module.exports = mongoose.model('CallLog', callLogSchema);
