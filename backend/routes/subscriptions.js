const express = require('express');
const Joi = require('joi');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const paymentService = require('../services/paymentService');

const router = express.Router();

// Validation schemas
const subscribeSchema = Joi.object({
  creatorId: Joi.string().required(),
  paymentDetails: Joi.object().default({})
});

// @route   POST /api/subscriptions/subscribe
// @desc    Subscribe to a creator
// @access  Private
router.post('/subscribe', auth, async (req, res) => {
  try {
    // Validate input
    const { error, value } = subscribeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { creatorId, paymentDetails } = value;
    const fanId = req.user._id;

    // Check if creator exists
    const creator = await User.findById(creatorId);
    if (!creator || creator.role !== 'creator') {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Check if user is trying to subscribe to themselves
    if (fanId.toString() === creatorId) {
      return res.status(400).json({ error: 'Cannot subscribe to yourself' });
    }

    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
      fanId,
      creatorId,
      paymentStatus: 'active',
      endDate: { $gt: new Date() }
    });

    if (existingSubscription) {
      return res.status(400).json({ error: 'Already subscribed to this creator' });
    }

    // Process payment
    const paymentResult = await paymentService.processPayment(
      fanId,
      creatorId,
      creator.subscriptionPrice,
      paymentDetails
    );

    if (!paymentResult.success) {
      return res.status(400).json({ 
        error: 'Payment failed',
        details: paymentResult.error
      });
    }

    // Create subscription
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    const subscription = new Subscription({
      fanId,
      creatorId,
      endDate,
      paymentStatus: 'active',
      amount: creator.subscriptionPrice,
      transactionId: paymentResult.transactionId,
      paymentMethod: paymentResult.paymentMethod
    });

    await subscription.save();

    // Update creator's subscriber count
    await User.findByIdAndUpdate(creatorId, {
      $inc: { subscriberCount: 1 }
    });

    // Populate subscription details
    await subscription.populate('creatorId', 'username profilePic subscriptionPrice');

    res.status(201).json({
      message: 'Subscription successful',
      subscription,
      paymentDetails: {
        transactionId: paymentResult.transactionId,
        amount: paymentResult.amount
      }
    });

  } catch (error) {
    console.error('Subscription error:', error);
    res.status(500).json({ error: 'Server error during subscription' });
  }
});

// @route   GET /api/subscriptions/my-subscriptions
// @desc    Get user's active subscriptions
// @access  Private
router.get('/my-subscriptions', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      fanId: req.user._id,
      paymentStatus: 'active',
      endDate: { $gt: new Date() }
    })
    .populate('creatorId', 'username profilePic bio subscriptionPrice')
    .sort({ createdAt: -1 });

    res.json({ subscriptions });

  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Server error fetching subscriptions' });
  }
});

// @route   GET /api/subscriptions/my-subscribers
// @desc    Get creator's subscribers
// @access  Private (Creators only)
router.get('/my-subscribers', auth, async (req, res) => {
  try {
    if (req.user.role !== 'creator') {
      return res.status(403).json({ error: 'Only creators can view subscribers' });
    }

    const subscriptions = await Subscription.find({
      creatorId: req.user._id,
      paymentStatus: 'active',
      endDate: { $gt: new Date() }
    })
    .populate('fanId', 'username profilePic')
    .sort({ createdAt: -1 });

    res.json({ 
      subscribers: subscriptions,
      totalSubscribers: subscriptions.length
    });

  } catch (error) {
    console.error('Get subscribers error:', error);
    res.status(500).json({ error: 'Server error fetching subscribers' });
  }
});

// @route   POST /api/subscriptions/cancel/:subscriptionId
// @desc    Cancel a subscription
// @access  Private
router.post('/cancel/:subscriptionId', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Check if user owns this subscription
    if (subscription.fanId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to cancel this subscription' });
    }

    // Update subscription status
    subscription.paymentStatus = 'cancelled';
    await subscription.save();

    // Update creator's subscriber count
    await User.findByIdAndUpdate(subscription.creatorId, {
      $inc: { subscriberCount: -1 }
    });

    res.json({ message: 'Subscription cancelled successfully' });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Server error cancelling subscription' });
  }
});

// @route   GET /api/subscriptions/check/:creatorId
// @desc    Check if user is subscribed to a creator
// @access  Private
router.get('/check/:creatorId', auth, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      fanId: req.user._id,
      creatorId: req.params.creatorId,
      paymentStatus: 'active',
      endDate: { $gt: new Date() }
    });

    res.json({
      isSubscribed: !!subscription,
      subscription: subscription || null
    });

  } catch (error) {
    console.error('Check subscription error:', error);
    res.status(500).json({ error: 'Server error checking subscription' });
  }
});

// @route   GET /api/subscriptions/payment-methods
// @desc    Get supported payment methods
// @access  Public
router.get('/payment-methods', (req, res) => {
  const paymentMethods = paymentService.getSupportedPaymentMethods();
  res.json({ paymentMethods });
});

module.exports = router;