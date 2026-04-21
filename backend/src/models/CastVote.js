const mongoose = require('mongoose');

const castVoteSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
  },
  // Store votes per question - completely isolated from user ID
  votes: [{
    questionId: {
      type: String,
      required: true,
    },
    // For multipleChoice: single optionId
    // For checkbox: array of optionIds
    // For fillInTheBlank: text string
    selected: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  }],
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for faster aggregation queries
castVoteSchema.index({ pollId: 1 });
castVoteSchema.index({ timestamp: 1 });

module.exports = mongoose.model('CastVote', castVoteSchema);
