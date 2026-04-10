const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');
const { protect, authorize } = require('../middleware/auth');

// ── POST /api/coupons/validate ── Validate a coupon code
router.post('/validate', protect, async (req, res) => {
  try {
    const { code, orderAmount, streamId } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Coupon code required.' });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code.' });

    // Stream-only check
    if (coupon.isStreamOnly && coupon.stream?.toString() !== streamId) {
      return res.status(400).json({ success: false, message: 'This coupon is only valid during the live stream.' });
    }

    const validation = coupon.isValidFor(req.user._id, orderAmount || 0);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.reason });
    }

    const discount = coupon.calculateDiscount(orderAmount || 0);

    res.json({
      success: true,
      data: {
        couponId: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
        freeShipping: coupon.type === 'free_shipping',
        description: coupon.description
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Coupon validation failed.' });
  }
});

// ── GET /api/coupons/my ── Seller's coupons
router.get('/my', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const coupons = await Coupon.find({ createdBy: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch coupons.' });
  }
});

// ── POST /api/coupons ── Create coupon
router.post('/', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const {
      code, description, type, value, minOrderAmount, maxDiscount,
      usageLimit, usageLimitPerUser, expiresAt, applicableCategories,
      streamId, isStreamOnly
    } = req.body;

    if (!code || !type || !value || !expiresAt) {
      return res.status(400).json({ success: false, message: 'Code, type, value, and expiry required.' });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      description, type, value,
      minOrderAmount: minOrderAmount || 0,
      maxDiscount,
      usageLimit, usageLimitPerUser: usageLimitPerUser || 1,
      expiresAt: new Date(expiresAt),
      applicableCategories,
      stream: streamId,
      isStreamOnly: isStreamOnly || false,
      createdBy: req.user._id,
      creatorRole: req.user.role
    });

    res.status(201).json({ success: true, message: 'Coupon created!', data: coupon });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists.' });
    }
    res.status(500).json({ success: false, message: 'Failed to create coupon.' });
  }
});

// ── PUT /api/coupons/:id ── Update coupon
router.put('/:id', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });

    const allowed = ['description', 'isActive', 'expiresAt', 'usageLimit', 'maxDiscount'];
    allowed.forEach(f => { if (req.body[f] !== undefined) coupon[f] = req.body[f]; });
    await coupon.save();

    res.json({ success: true, message: 'Coupon updated.', data: coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update coupon.' });
  }
});

// ── DELETE /api/coupons/:id ──
router.delete('/:id', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    await Coupon.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete coupon.' });
  }
});

module.exports = router;
