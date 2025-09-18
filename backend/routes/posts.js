const express = require('express');
const Joi = require('joi');
const Post = require('../models/Post');
const User = require('../models/User');
const { auth, requireRole } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { checkSubscription } = require('../middleware/subscription');

const router = express.Router();

// Validation schemas
const createPostSchema = Joi.object({
  title: Joi.string().max(200).required(),
  content: Joi.string().max(2000).required(),
  isPublic: Joi.boolean().default(false),
  price: Joi.number().min(0).default(0),
  tags: Joi.array().items(Joi.string().trim()).default([])
});

// @route   POST /api/posts
// @desc    Create a new post
// @access  Private (Creators only)
router.post('/', 
  auth, 
  requireRole(['creator']), 
  upload.array('media', 10),
  handleUploadError,
  async (req, res) => {
    try {
      // Validate input
      const { error, value } = createPostSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }

      const { title, content, isPublic, price, tags } = value;

      // Process uploaded files
      const mediaURL = req.files ? req.files.map(file => `/uploads/${req.user._id}/${file.filename}`) : [];
      
      // Determine media type
      let mediaType = 'text';
      if (mediaURL.length > 0) {
        const hasImages = req.files.some(file => file.mimetype.startsWith('image/'));
        const hasVideos = req.files.some(file => file.mimetype.startsWith('video/'));
        
        if (hasImages && hasVideos) {
          mediaType = 'mixed';
        } else if (hasImages) {
          mediaType = 'image';
        } else if (hasVideos) {
          mediaType = 'video';
        }
      }

      // Create post
      const post = new Post({
        creatorId: req.user._id,
        title,
        content,
        mediaURL,
        mediaType,
        isPublic,
        price,
        tags
      });

      await post.save();

      // Populate creator info
      await post.populate('creatorId', 'username profilePic');

      res.status(201).json({
        message: 'Post created successfully',
        post
      });

    } catch (error) {
      console.error('Post creation error:', error);
      res.status(500).json({ error: 'Server error during post creation' });
    }
  }
);

// @route   GET /api/posts
// @desc    Get posts feed (subscribed creators only)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get user's subscriptions
    const Subscription = require('../models/Subscription');
    const subscriptions = await Subscription.find({
      fanId: req.user._id,
      paymentStatus: 'active',
      endDate: { $gt: new Date() }
    }).select('creatorId');

    const subscribedCreatorIds = subscriptions.map(sub => sub.creatorId);

    // If user is a creator, include their own posts
    if (req.user.role === 'creator') {
      subscribedCreatorIds.push(req.user._id);
    }

    // Get posts from subscribed creators + public posts
    const posts = await Post.find({
      $or: [
        { creatorId: { $in: subscribedCreatorIds } },
        { isPublic: true }
      ]
    })
    .populate('creatorId', 'username profilePic subscriptionPrice')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total: posts.length
      }
    });

  } catch (error) {
    console.error('Posts feed error:', error);
    res.status(500).json({ error: 'Server error fetching posts' });
  }
});

// @route   GET /api/posts/creator/:creatorId
// @desc    Get posts by specific creator
// @access  Private (requires subscription for private posts)
router.get('/creator/:creatorId', auth, async (req, res) => {
  try {
    const { creatorId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if user has access to this creator's content
    const Subscription = require('../models/Subscription');
    const hasSubscription = await Subscription.findOne({
      fanId: req.user._id,
      creatorId: creatorId,
      paymentStatus: 'active',
      endDate: { $gt: new Date() }
    });

    const isOwnProfile = req.user._id.toString() === creatorId;

    // Build query based on access level
    let query = { creatorId };
    if (!hasSubscription && !isOwnProfile) {
      query.isPublic = true; // Only public posts if no subscription
    }

    const posts = await Post.find(query)
      .populate('creatorId', 'username profilePic subscriptionPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get creator info
    const creator = await User.findById(creatorId).select('-passwordHash');

    res.json({
      creator,
      posts,
      hasSubscription: !!hasSubscription || isOwnProfile,
      pagination: {
        page,
        limit,
        total: posts.length
      }
    });

  } catch (error) {
    console.error('Creator posts error:', error);
    res.status(500).json({ error: 'Server error fetching creator posts' });
  }
});

// @route   GET /api/posts/:postId
// @desc    Get single post
// @access  Private (requires subscription for private posts)
router.get('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('creatorId', 'username profilePic subscriptionPrice')
      .populate('comments.userId', 'username profilePic')
      .populate('likes.userId', 'username');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check access permissions
    const isOwnPost = req.user._id.toString() === post.creatorId._id.toString();
    
    if (!post.isPublic && !isOwnPost) {
      // Check subscription
      const Subscription = require('../models/Subscription');
      const hasSubscription = await Subscription.findOne({
        fanId: req.user._id,
        creatorId: post.creatorId._id,
        paymentStatus: 'active',
        endDate: { $gt: new Date() }
      });

      if (!hasSubscription) {
        return res.status(403).json({ 
          error: 'Subscription required to view this post',
          requiresSubscription: true,
          creator: post.creatorId
        });
      }
    }

    // Increment view count
    post.viewCount += 1;
    await post.save();

    res.json({ post });

  } catch (error) {
    console.error('Single post error:', error);
    res.status(500).json({ error: 'Server error fetching post' });
  }
});

// @route   POST /api/posts/:postId/like
// @desc    Like/unlike a post
// @access  Private
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = post.likes.find(
      like => like.userId.toString() === req.user._id.toString()
    );

    if (existingLike) {
      // Unlike
      post.likes = post.likes.filter(
        like => like.userId.toString() !== req.user._id.toString()
      );
    } else {
      // Like
      post.likes.push({ userId: req.user._id });
    }

    await post.save();

    res.json({
      message: existingLike ? 'Post unliked' : 'Post liked',
      likesCount: post.likes.length,
      isLiked: !existingLike
    });

  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Server error liking post' });
  }
});

// @route   POST /api/posts/:postId/comment
// @desc    Add comment to post
// @access  Private
router.post('/:postId/comment', auth, async (req, res) => {
  try {
    const commentSchema = Joi.object({
      content: Joi.string().max(500).required()
    });

    const { error, value } = commentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.comments.push({
      userId: req.user._id,
      content: value.content
    });

    await post.save();
    await post.populate('comments.userId', 'username profilePic');

    res.json({
      message: 'Comment added successfully',
      comment: post.comments[post.comments.length - 1]
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Server error adding comment' });
  }
});

// @route   DELETE /api/posts/:postId
// @desc    Delete a post
// @access  Private (Creator only)
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if user owns the post
    if (post.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await Post.findByIdAndDelete(req.params.postId);

    res.json({ message: 'Post deleted successfully' });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Server error deleting post' });
  }
});

module.exports = router;