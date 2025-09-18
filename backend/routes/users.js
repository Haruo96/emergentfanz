const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Subscription = require('../models/Subscription');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/creators
// @desc    Get all creators
// @access  Public
router.get('/creators', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build search query
    let query = { role: 'creator', isActive: true };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    const creators = await User.find(query)
      .select('-passwordHash')
      .sort({ subscriberCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.json({
      creators,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get creators error:', error);
    res.status(500).json({ error: 'Server error fetching creators' });
  }
});

// @route   GET /api/users/:userId
// @desc    Get user profile
// @access  Public
router.get('/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-passwordHash');

    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's post count
    const postCount = await Post.countDocuments({ creatorId: user._id });

    // If it's a creator, get additional stats
    let stats = { postCount };
    if (user.role === 'creator') {
      const totalLikes = await Post.aggregate([
        { $match: { creatorId: user._id } },
        { $project: { likesCount: { $size: '$likes' } } },
        { $group: { _id: null, total: { $sum: '$likesCount' } } }
      ]);

      stats.totalLikes = totalLikes[0]?.total || 0;
    }

    res.json({
      user,
      stats
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

// @route   GET /api/users/:userId/posts
// @desc    Get user's public posts
// @access  Public
router.get('/:userId/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({
      creatorId: req.params.userId,
      isPublic: true
    })
    .populate('creatorId', 'username profilePic')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Post.countDocuments({
      creatorId: req.params.userId,
      isPublic: true
    });

    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'Server error fetching user posts' });
  }
});

module.exports = router;