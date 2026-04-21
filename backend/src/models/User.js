const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['admin', 'voter'],
    default: 'voter',
  },
// REMOVE THIS:
  // hasVoted: {
  //   type: Boolean,
  //   default: false,
  // },

  // ADD THIS:
  votedPolls: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll'
  }],
  // Demographic data collected during screening
  profile: {
    name: {
      type: String,
      default: '',
    },
    age: {
      type: Number,
      default: null,
    },
  },
  isScreened: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Index for faster queries (email index already created by unique: true)
userSchema.index({ role: 1 });
userSchema.index({ hasVoted: 1 });

module.exports = mongoose.model('User', userSchema);
