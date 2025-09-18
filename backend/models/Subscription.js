const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  fanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'active', 'expired', 'cancelled'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  transactionId: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    default: 'placeholder'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate subscriptions
subscriptionSchema.index({ fanId: 1, creatorId: 1 }, { unique: true });

// Index for expiration queries
subscriptionSchema.index({ endDate: 1, paymentStatus: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);