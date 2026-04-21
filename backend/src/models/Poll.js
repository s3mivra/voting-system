const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },

  // Dynamic questions array - acts like Google Forms
  // Dynamic questions array - acts like Google Forms
  questions: [{
    id: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['multipleChoice', 'fillInTheBlank', 'checkbox'],
      required: true,
    },
    required: {
      type: Boolean,
      default: true,
    },
    // ADD THIS NEW BLOCK
    display: {
      type: Boolean,
      default: true,
    },
    // Options for multipleChoice and checkbox types
    options: [{
      id: {
        type: String,
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
    }],
  }],
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'draft',
  },
  startDate: {
    type: Date,
    default: null,
  },
  endDate: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Index for faster queries
pollSchema.index({ status: 1 });
pollSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Poll', pollSchema);
