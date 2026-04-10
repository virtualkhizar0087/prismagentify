const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');

// GET /api/influencers — list verified influencers
router.get('/', async (req, res) => {
  try {
    const { niche, tier, page = 1, limit = 20 } = req.query;
    const filter = { role: 'influencer', isActive: true };
    if (niche) filter['influencerProfile.niche'] = niche;
    if (tier) filter['influencerProfile.tier'] = tier;

    const influencers = await User.find(filter)
      .select('name avatar city influencerProfile createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: influencers.map(i => i.toPublicJSON()) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get influencers.' });
  }
});

// GET /api/influencers/earnings — influencer's commission dashboard
router.get('/earnings', protect, authorize('influencer'), async (req, res) => {
  try {
    const earnings = await Order.aggregate([
      { $match: { influencer: req.user._id, status: 'delivered' } },
      { $group: {
        _id: null,
        totalCommission: { $sum: '$influencerCommission' },
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalAmount' }
      }}
    ]);

    res.json({
      success: true,
      data: {
        earnings: earnings[0] || { totalCommission: 0, totalOrders: 0 },
        walletBalance: req.user.walletBalance,
        commissionRate: req.user.influencerProfile?.commissionRate || 10
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get earnings.' });
  }
});

// ── POST /api/influencers/withdraw — Request a payout
router.post('/withdraw', protect, authorize('influencer'), async (req, res) => {
  try {
    const { amount, method, accountNumber } = req.body;
    if (!amount || amount < 500) {
      return res.status(400).json({ success: false, message: 'Minimum withdrawal is PKR 500.' });
    }
    if (!method || !accountNumber) {
      return res.status(400).json({ success: false, message: 'Payment method and account number required.' });
    }

    const influencer = await User.findById(req.user._id);
    if (!influencer) return res.status(404).json({ success: false, message: 'Influencer not found.' });
    if ((influencer.walletBalance || 0) < amount) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Available: PKR ${influencer.walletBalance || 0}` });
    }

    influencer.walletBalance -= amount;
    if (!influencer.withdrawalHistory) influencer.withdrawalHistory = [];
    influencer.withdrawalHistory.unshift({
      amount, method, accountNumber,
      status: 'pending',
      createdAt: new Date()
    });
    await influencer.save();

    res.json({
      success: true,
      message: `Withdrawal of PKR ${amount.toLocaleString()} requested via ${method}. Processing in 1-2 business days.`,
      data: { newBalance: influencer.walletBalance, withdrawal: influencer.withdrawalHistory[0] }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Withdrawal failed.' });
  }
});

// ── GET /api/influencers/withdrawals — Get withdrawal history
router.get('/withdrawals', protect, authorize('influencer'), async (req, res) => {
  try {
    const influencer = await User.findById(req.user._id).select('withdrawalHistory');
    res.json({ success: true, data: { withdrawals: influencer?.withdrawalHistory || [] } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals.' });
  }
});

module.exports = router;
