const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Stream = require('../models/Stream');
const User = require('../models/User');
const streamController = require('../controllers/streamController');
const agoraService = require('../services/agoraService');

router.get('/', streamController.getStreams);
router.get('/my-streams', protect, authorize('seller'), streamController.getMyStreams);
router.get('/:id', streamController.getStream);
router.post('/', protect, authorize('seller'), streamController.createStream);
router.post('/:id/go-live', protect, authorize('seller'), streamController.goLive);
router.post('/:id/end', protect, authorize('seller'), streamController.endStream);
router.patch('/:id/pin-product', protect, authorize('seller'), streamController.pinProduct);

// ── GET /api/streams/:id/agora-token ── Get Agora RTC token
router.get('/:id/agora-token', protect, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id);
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found.' });

    const isHost = stream.seller.toString() === req.user._id.toString() ||
                   stream.influencer?.toString() === req.user._id.toString();

    const channelName = agoraService.getChannelName(stream._id.toString());
    const uid = parseInt(req.user._id.toString().slice(-8), 16) % 100000;
    const role = isHost ? 'publisher' : 'subscriber';

    const token = agoraService.generateToken(channelName, uid, role);

    if (!stream.agoraChannel) {
      stream.agoraChannel = channelName;
      await stream.save();
    }

    res.json({
      success: true,
      data: { token, channelName, uid, role, appId: process.env.AGORA_APP_ID }
    });
  } catch (error) {
    console.error('Agora token error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Failed to generate stream token.' });
  }
});

// ── POST /api/streams/:id/gift ── Send a gift to the seller
router.post('/:id/gift', protect, async (req, res) => {
  try {
    const { giftType, amount, receiverId } = req.body;
    if (!giftType || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Gift type and amount required.' });
    }

    const stream = await Stream.findById(req.params.id);
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found.' });

    // Deduct from sender wallet
    const sender = await User.findById(req.user._id);
    if (!sender) return res.status(404).json({ success: false, message: 'User not found.' });
    if ((sender.walletBalance || 0) < amount) {
      return res.status(400).json({ success: false, message: `Insufficient wallet balance. You need PKR ${amount} but have PKR ${sender.walletBalance || 0}.` });
    }

    sender.walletBalance = (sender.walletBalance || 0) - amount;
    await sender.save();

    // Credit 70% to receiver (platform takes 30%)
    const receiverAmount = Math.floor(amount * 0.7);
    const sellerId = receiverId || stream.seller;
    await User.findByIdAndUpdate(sellerId, { $inc: { walletBalance: receiverAmount } });

    // Track in stream revenue
    stream.giftRevenue = (stream.giftRevenue || 0) + amount;
    await stream.save();

    res.json({
      success: true,
      message: `${giftType} gift sent! PKR ${amount} deducted.`,
      data: { giftType, amount, newBalance: sender.walletBalance }
    });
  } catch (error) {
    console.error('Gift error:', error.message);
    res.status(500).json({ success: false, message: 'Gift failed.' });
  }
});

module.exports = router;
