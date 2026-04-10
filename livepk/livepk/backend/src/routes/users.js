const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');

// GET /api/users/:id — public profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user.toPublicJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get user.' });
  }
});

// PATCH /api/users/wallet/topup — add wallet balance (admin for testing)
router.patch('/wallet/topup', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const user = await User.findByIdAndUpdate(userId, { $inc: { walletBalance: amount } }, { new: true });
    res.json({ success: true, data: { walletBalance: user.walletBalance } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Wallet update failed.' });
  }
});

module.exports = router;
