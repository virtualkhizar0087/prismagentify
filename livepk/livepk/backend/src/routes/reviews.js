const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

// ── GET /api/reviews/product/:productId ──
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = '-createdAt', rating } = req.query;
    const filter = { product: req.params.productId, isApproved: true };
    if (rating) filter.rating = parseInt(rating);

    const reviews = await Review.find(filter)
      .populate('buyer', 'name avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    // Rating breakdown
    const breakdown = await Review.aggregate([
      { $match: { product: require('mongoose').Types.ObjectId.createFromHexString(req.params.productId), isApproved: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } }
    ]);

    res.json({ success: true, data: reviews, total, breakdown });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews.' });
  }
});

// ── POST /api/reviews ── Create review
router.post('/', protect, authorize('buyer'), async (req, res) => {
  try {
    const { productId, orderId, rating, title, comment, qualityRating, deliveryRating, valueRating } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ success: false, message: 'Product ID and rating required.' });
    }

    // Check if buyer already reviewed this product
    const existing = await Review.findOne({ product: productId, buyer: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }

    // Verify purchase (optional but marks as verified)
    let isVerifiedPurchase = false;
    let seller;
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        buyer: req.user._id,
        'items.product': productId,
        status: 'delivered'
      });
      if (order) {
        isVerifiedPurchase = true;
        seller = order.seller;
      }
    }

    if (!seller) {
      const Product = require('../models/Product');
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
      seller = product.seller;
    }

    const review = await Review.create({
      product: productId,
      buyer: req.user._id,
      seller,
      order: orderId,
      rating, title, comment,
      qualityRating, deliveryRating, valueRating,
      isVerifiedPurchase
    });

    await review.populate('buyer', 'name avatar');

    res.status(201).json({ success: true, message: 'Review submitted successfully!', data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }
    res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
});

// ── PUT /api/reviews/:id ── Update own review
router.put('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, buyer: req.user._id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    const { rating, title, comment, qualityRating, deliveryRating, valueRating } = req.body;
    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    if (qualityRating) review.qualityRating = qualityRating;
    if (deliveryRating) review.deliveryRating = deliveryRating;
    if (valueRating) review.valueRating = valueRating;

    await review.save();
    res.json({ success: true, message: 'Review updated.', data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update review.' });
  }
});

// ── DELETE /api/reviews/:id ── Delete own review
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findOne({
      _id: req.params.id,
      $or: [{ buyer: req.user._id }, { seller: req.user._id }]
    });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    await review.deleteOne();
    res.json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete review.' });
  }
});

// ── POST /api/reviews/:id/helpful ── Mark as helpful
router.post('/:id/helpful', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    const alreadyVoted = review.helpfulVotes.includes(req.user._id);
    if (alreadyVoted) {
      review.helpfulVotes.pull(req.user._id);
      review.helpfulCount = Math.max(0, review.helpfulCount - 1);
    } else {
      review.helpfulVotes.push(req.user._id);
      review.helpfulCount += 1;
    }
    await review.save();

    res.json({ success: true, helpful: !alreadyVoted, helpfulCount: review.helpfulCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to vote.' });
  }
});

// ── POST /api/reviews/:id/seller-reply ── Seller replies to review
router.post('/:id/seller-reply', protect, authorize('seller'), async (req, res) => {
  try {
    const { comment } = req.body;
    const review = await Review.findOne({ _id: req.params.id, seller: req.user._id });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    review.sellerReply = { comment, repliedAt: new Date() };
    await review.save();

    res.json({ success: true, message: 'Reply added.', data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add reply.' });
  }
});

module.exports = router;
