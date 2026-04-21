const mongoose = require('mongoose');

const voterReceiptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound unique index on userId and pollId to physically prevent double-voting
voterReceiptSchema.index({ userId: 1, pollId: 1 }, { unique: true });

module.exports = mongoose.model('VoterReceipt', voterReceiptSchema);
