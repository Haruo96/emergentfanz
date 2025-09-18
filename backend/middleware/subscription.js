const Subscription = require('../models/Subscription');

const checkSubscription = async (req, res, next) => {
  try {
    const { creatorId } = req.params;
    const fanId = req.user._id;

    // If user is the creator themselves, allow access
    if (fanId.toString() === creatorId) {
      return next();
    }

    // Check if user has active subscription
    const subscription = await Subscription.findOne({
      fanId: fanId,
      creatorId: creatorId,
      paymentStatus: 'active',
      endDate: { $gt: new Date() }
    });

    if (!subscription) {
      return res.status(403).json({ 
        error: 'Subscription required to access this content.',
        requiresSubscription: true,
        creatorId: creatorId
      });
    }

    req.subscription = subscription;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking subscription status.' });
  }
};

module.exports = { checkSubscription };