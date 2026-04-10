const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');
const { protect } = require('../middleware/auth');

// ── GET /api/wishlist ── Get buyer's wishlist
router.get('/', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ buyer: req.user._id })
      .populate('items.product', 'name thumbnail price salePrice isActive stock rating');

    res.json({ success: true, data: wishlist?.items || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist.' });
  }
});

// ── POST /api/wishlist/:productId ── Add to wishlist
router.post('/:productId', protect, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ buyer: req.user._id });

    if (!wishlist) {
      wishlist = await Wishlist.create({ buyer: req.user._id, items: [] });
    }

    const alreadyIn = wishlist.items.some(i => i.product.toString() === req.params.productId);
    if (alreadyIn) {
      return res.status(400).json({ success: false, message: 'Product already in wishlist.' });
    }

    wishlist.items.push({
      product: req.params.productId,
      notifyOnSale: req.body.notifyOnSale !== false
    });
    await wishlist.save();

    res.json({ success: true, message: 'Added to wishlist!', count: wishlist.items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add to wishlist.' });
  }
});

// ── DELETE /api/wishlist/:productId ── Remove from wishlist
router.delete('/:productId', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ buyer: req.user._id });
    if (!wishlist) return res.status(404).json({ success: false, message: 'Wishlist not found.' });

    wishlist.items = wishlist.items.filter(i => i.product.toString() !== req.params.productId);
    await wishlist.save();

    res.json({ success: true, message: 'Removed from wishlist.', count: wishlist.items.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist.' });
  }
});

// ── GET /api/wishlist/check/:productId ── Check if product in wishlist
router.get('/check/:productId', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ buyer: req.user._id });
    const inWishlist = wishlist?.items.some(i => i.product.toString() === req.params.productId) || false;
    res.json({ success: true, inWishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check wishlist.' });
  }
});

// ── DELETE /api/wishlist ── Clear entire wishlist
router.delete('/', protect, async (req, res) => {
  try {
    await Wishlist.findOneAndUpdate({ buyer: req.user._id }, { items: [] });
    res.json({ success: true, message: 'Wishlist cleared.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear wishlist.' });
  }
});

module.exports = router;
