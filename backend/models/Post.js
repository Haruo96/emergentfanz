const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  mediaURL: [{
    type: String,
    default: []
  }],
  mediaType: {
    type: String,
    enum: ['text', 'image', 'video', 'mixed'],
    default: 'text'
  },
  isPublic: {
    type: Boolean,
    default: false // false means subscribers only
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
postSchema.index({ creatorId: 1, createdAt: -1 });
postSchema.index({ isPublic: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);