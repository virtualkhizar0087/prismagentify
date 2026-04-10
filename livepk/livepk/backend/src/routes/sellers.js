// sellers.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');
const Stream = require('../models/Stream');

// GET /api/sellers — list verified sellers
router.get('/', async (req, res) => {
  try {
    const { category, city, page = 1, limit = 20 } = req.query;
    const filter = { role: 'seller', isActive: true, 'sellerProfile.isVerified': true };
    if (city) filter.city = city;
    if (category) filter['sellerProfile.category'] = category;

    const sellers = await User.find(filter)
      .select('name avatar city sellerProfile createdAt')
      .sort('-sellerProfile.rating')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: sellers.map(s => s.toPublicJSON()) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get sellers.' });
  }
});

// GET /api/sellers/dashboard — seller's own analytics
router.get('/dashboard', protect, authorize('seller'), async (req, res) => {
  try {
    const [orderStats, streamStats] = await Promise.all([
      Order.aggregate([
        { $match: { seller: req.user._id } },
        { $group: {
          _id: null,
          totalRevenue: { $sum: '$sellerAmount' },
          totalOrders: { $sum: 1 },
          pendingOrders: { $sum: { $cond: [{ $in: ['$status', ['placed','confirmed','processing']] }, 1, 0] } },
          deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }
        }}
      ]),
      Stream.aggregate([
        { $match: { seller: req.user._id } },
        { $group: {
          _id: null,
          totalStreams: { $sum: 1 },
          totalViewers: { $sum: '$totalViews' },
          totalStreamRevenue: { $sum: '$totalRevenue' },
          liveNow: { $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] } }
        }}
      ])
    ]);

    res.json({
      success: true,
      data: {
        orders: orderStats[0] || {},
        streams: streamStats[0] || {},
        walletBalance: req.user.walletBalance
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Dashboard data failed.' });
  }
});

// ── POST /api/sellers/withdraw — Request a payout
router.post('/withdraw', protect, authorize('seller'), async (req, res) => {
  try {
    const { amount, method, accountNumber } = req.body;
    if (!amount || amount < 500) return res.status(400).json({ success: false, message: 'Minimum withdrawal is PKR 500.' });
    if (!method || !accountNumber) return res.status(400).json({ success: false, message: 'Payment method and account number required.' });

    const seller = await User.findById(req.user._id);
    if (!seller) return res.status(404).json({ success: false, message: 'Seller not found.' });
    if ((seller.walletBalance || 0) < amount) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: PKR ${seller.walletBalance || 0}` });
    }

    // Deduct from wallet immediately (pending payout)
    seller.walletBalance -= amount;
    if (!seller.withdrawalHistory) seller.withdrawalHistory = [];
    seller.withdrawalHistory.unshift({
      amount, method, accountNumber,
      status: 'pending',
      createdAt: new Date()
    });
    await seller.save();

    res.json({
      success: true,
      message: `Withdrawal of PKR ${amount.toLocaleString()} requested via ${method}. Processing in 1-2 business days.`,
      data: { newBalance: seller.walletBalance, withdrawal: seller.withdrawalHistory[0] }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Withdrawal failed.' });
  }
});

// ── GET /api/sellers/withdrawals — Get withdrawal history
router.get('/withdrawals', protect, authorize('seller'), async (req, res) => {
  try {
    const seller = await User.findById(req.user._id).select('withdrawalHistory');
    res.json({ success: true, data: { withdrawals: seller?.withdrawalHistory || [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals.' });
  }
});

module.exports = router;
