const express = require('express');
const router = express.Router();
const Auction = require('../models/Auction');
const { protect, authorize } = require('../middleware/auth');

// ── GET /api/auctions/stream/:streamId ── Get auctions for a stream
router.get('/stream/:streamId', async (req, res) => {
  try {
    const auctions = await Auction.find({ stream: req.params.streamId })
      .populate('product', 'name thumbnail')
      .populate('currentWinner', 'name')
      .sort('-createdAt');
    res.json({ success: true, data: auctions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch auctions.' });
  }
});

// ── GET /api/auctions/:id ── Get auction details
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('product', 'name thumbnail description')
      .populate('seller', 'name sellerProfile')
      .populate('bids.bidder', 'name');
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found.' });
    res.json({ success: true, data: auction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch auction.' });
  }
});

// ── POST /api/auctions ── Create auction (seller)
router.post('/', protect, authorize('seller'), async (req, res) => {
  try {
    const {
      streamId, productId, title, description,
      startingPrice, reservePrice, buyNowPrice,
      bidIncrement, startTime, duration, autoExtend
    } = req.body;

    if (!streamId || !productId || !startingPrice || !startTime) {
      return res.status(400).json({ success: false, message: 'Stream, product, starting price, and start time required.' });
    }

    const durationSecs = duration || 300;
    const start = new Date(startTime);
    const end = new Date(start.getTime() + durationSecs * 1000);

    const auction = await Auction.create({
      stream: streamId,
      seller: req.user._id,
      product: productId,
      title, description,
      startingPrice,
      reservePrice, buyNowPrice,
      bidIncrement: bidIncrement || 100,
      startTime: start,
      endTime: end,
      duration: durationSecs,
      autoExtend: autoExtend !== false,
      currentBid: startingPrice - (bidIncrement || 100)
    });

    res.status(201).json({ success: true, message: 'Auction created!', data: auction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create auction.' });
  }
});

// ── POST /api/auctions/:id/bid ── Place a bid
router.post('/:id/bid', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const auction = await Auction.findById(req.params.id);

    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found.' });
    if (auction.status !== 'live') return res.status(400).json({ success: false, message: 'Auction is not live.' });
    if (new Date() > auction.endTime) return res.status(400).json({ success: false, message: 'Auction has ended.' });
    if (auction.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Sellers cannot bid on their own auctions.' });
    }

    const minBid = auction.currentBid + auction.bidIncrement;
    if (amount < minBid) {
      return res.status(400).json({ success: false, message: `Minimum bid is PKR ${minBid.toLocaleString()}.` });
    }

    // Remove previous winning bid
    auction.bids.forEach(b => b.isWinning = false);

    // Add new bid
    auction.bids.push({
      bidder: req.user._id,
      bidderName: req.user.name,
      amount,
      isWinning: true
    });

    auction.currentBid = amount;
    auction.currentWinner = req.user._id;
    auction.currentWinnerName = req.user.name;
    auction.totalBids += 1;

    // Auto-extend if bid placed in last 30 seconds
    const timeLeft = (auction.endTime - new Date()) / 1000;
    if (auction.autoExtend && timeLeft < auction.extensionTime) {
      auction.endTime = new Date(auction.endTime.getTime() + auction.extensionTime * 1000);
      auction.extensions += 1;
    }

    await auction.save();

    res.json({
      success: true,
      message: 'Bid placed successfully!',
      data: {
        currentBid: auction.currentBid,
        currentWinner: auction.currentWinnerName,
        totalBids: auction.totalBids,
        endTime: auction.endTime
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to place bid.' });
  }
});

// ── POST /api/auctions/:id/buy-now ── Buy Now
router.post('/:id/buy-now', protect, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found.' });
    if (auction.status !== 'live') return res.status(400).json({ success: false, message: 'Auction is not live.' });
    if (!auction.buyNowPrice) return res.status(400).json({ success: false, message: 'Buy Now not available for this auction.' });

    auction.status = 'sold';
    auction.winner = req.user._id;
    auction.winningBid = auction.buyNowPrice;
    auction.endTime = new Date();
    await auction.save();

    res.json({ success: true, message: `Congratulations! You bought it for PKR ${auction.buyNowPrice.toLocaleString()}!`, data: auction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Buy Now failed.' });
  }
});

// ── PATCH /api/auctions/:id/start ── Start auction (seller)
router.patch('/:id/start', protect, authorize('seller'), async (req, res) => {
  try {
    const auction = await Auction.findOne({ _id: req.params.id, seller: req.user._id });
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found.' });

    auction.status = 'live';
    auction.startTime = new Date();
    auction.endTime = new Date(Date.now() + auction.duration * 1000);
    await auction.save();

    res.json({ success: true, message: 'Auction started!', data: auction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to start auction.' });
  }
});

// ── PATCH /api/auctions/:id/end ── End auction (seller/auto)
router.patch('/:id/end', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) return res.status(404).json({ success: false, message: 'Auction not found.' });

    auction.status = auction.currentWinner ? 'sold' : 'no_sale';
    auction.endTime = new Date();
    if (auction.currentWinner) {
      auction.winner = auction.currentWinner;
      auction.winningBid = auction.currentBid;
    }
    await auction.save();

    res.json({ success: true, message: 'Auction ended.', data: auction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to end auction.' });
  }
});

module.exports = router;
