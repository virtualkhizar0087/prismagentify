const Stream = require('../models/Stream');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

// ══════════════════════════════════════════
// GET /api/streams
// Get live and upcoming streams (homepage feed)
// ══════════════════════════════════════════
exports.getStreams = async (req, res) => {
  try {
    const { status = 'live', category, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    filter.isPrivate = false;

    const streams = await Stream.find(filter)
      .populate('seller', 'name avatar sellerProfile.storeName sellerProfile.rating city')
      .populate('influencer', 'name avatar influencerProfile.handle influencerProfile.tier')
      .populate('products.product', 'name thumbnail price salePrice')
      .sort({ isFeatured: -1, viewerCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Stream.countDocuments(filter);

    res.json({
      success: true,
      data: {
        streams,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get streams.' });
  }
};

// ══════════════════════════════════════════
// GET /api/streams/:id
// Get single stream details
// ══════════════════════════════════════════
exports.getStream = async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.id)
      .populate('seller', 'name avatar sellerProfile city')
      .populate('influencer', 'name avatar influencerProfile')
      .populate('products.product');

    if (!stream) {
      return res.status(404).json({ success: false, message: 'Stream not found.' });
    }

    // Increment view count
    await Stream.findByIdAndUpdate(req.params.id, { $inc: { totalViews: 1 } });

    res.json({ success: true, data: stream });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get stream.' });
  }
};

// ══════════════════════════════════════════
// POST /api/streams
// Create/schedule a new stream (seller only)
// ══════════════════════════════════════════
exports.createStream = async (req, res) => {
  try {
    const {
      title, description, category, type,
      scheduledAt, productIds, influencerId,
      flashSale, thumbnail
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category required.' });
    }

    // Validate products belong to this seller
    let products = [];
    if (productIds?.length) {
      const foundProducts = await Product.find({
        _id: { $in: productIds },
        seller: req.user._id,
        isActive: true,
        isApproved: true
      });
      products = foundProducts.map(p => ({
        product: p._id,
        streamPrice: p.salePrice || p.price,
        streamStock: p.stock
      }));
    }

    // Generate Agora channel name
    const agoraChannel = `livepk_${req.user._id}_${uuidv4().replace(/-/g, '').slice(0, 12)}`;

    const stream = await Stream.create({
      title,
      description,
      thumbnail,
      seller: req.user._id,
      influencer: influencerId || null,
      category,
      type: type || 'regular',
      scheduledAt: scheduledAt || new Date(),
      products,
      agoraChannel,
      flashSale: flashSale || { isActive: false },
      status: scheduledAt && new Date(scheduledAt) > new Date() ? 'scheduled' : 'scheduled'
    });

    await stream.populate('seller', 'name avatar sellerProfile');

    res.status(201).json({
      success: true,
      message: 'Stream created! Ready to go live.',
      data: stream
    });
  } catch (error) {
    console.error('Create stream error:', error);
    res.status(500).json({ success: false, message: 'Failed to create stream.' });
  }
};

// ══════════════════════════════════════════
// POST /api/streams/:id/go-live
// Start the stream
// ══════════════════════════════════════════
exports.goLive = async (req, res) => {
  try {
    const stream = await Stream.findOne({
      _id: req.params.id,
      seller: req.user._id
    });

    if (!stream) {
      return res.status(404).json({ success: false, message: 'Stream not found.' });
    }

    if (stream.status === 'live') {
      return res.status(400).json({ success: false, message: 'Stream is already live.' });
    }

    stream.status = 'live';
    stream.startedAt = new Date();
    await stream.save();

    res.json({
      success: true,
      message: '🔴 You are now LIVE!',
      data: {
        stream,
        agoraConfig: {
          appId: process.env.AGORA_APP_ID,
          channel: stream.agoraChannel,
          token: null // Generate real token in production
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to go live.' });
  }
};

// ══════════════════════════════════════════
// POST /api/streams/:id/end
// End the stream
// ══════════════════════════════════════════
exports.endStream = async (req, res) => {
  try {
    const stream = await Stream.findOne({
      _id: req.params.id,
      seller: req.user._id
    });

    if (!stream) {
      return res.status(404).json({ success: false, message: 'Stream not found.' });
    }

    const duration = stream.startedAt
      ? Math.floor((new Date() - stream.startedAt) / 1000)
      : 0;

    const convRate = stream.totalViews > 0
      ? ((stream.totalOrders / stream.totalViews) * 100).toFixed(2)
      : 0;

    stream.status = 'ended';
    stream.endedAt = new Date();
    stream.duration = duration;
    stream.viewerCount = 0;
    stream.conversionRate = convRate;
    await stream.save();

    res.json({
      success: true,
      message: 'Stream ended.',
      data: {
        summary: {
          duration: `${Math.floor(duration / 60)} minutes`,
          totalViews: stream.totalViews,
          peakViewers: stream.peakViewers,
          totalOrders: stream.totalOrders,
          totalRevenue: `PKR ${stream.totalRevenue.toLocaleString()}`,
          conversionRate: `${convRate}%`,
          chatMessages: stream.chatMessages
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to end stream.' });
  }
};

// ══════════════════════════════════════════
// PATCH /api/streams/:id/pin-product
// Pin a product during live stream
// ══════════════════════════════════════════
exports.pinProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const stream = await Stream.findOne({ _id: req.params.id, seller: req.user._id });
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found.' });

    // Unpin all, then pin selected
    stream.products.forEach(p => { p.isPinned = p.product.toString() === productId; });
    await stream.save();

    res.json({ success: true, message: 'Product pinned.', data: stream });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to pin product.' });
  }
};

// ══════════════════════════════════════════
// GET /api/streams/seller/my-streams
// Get seller's own streams
// ══════════════════════════════════════════
exports.getMyStreams = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { seller: req.user._id };
    if (status) filter.status = status;

    const streams = await Stream.find(filter)
      .populate('products.product', 'name thumbnail price')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Stream.countDocuments(filter);

    res.json({ success: true, data: { streams, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get streams.' });
  }
};
