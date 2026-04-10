const mongoose = require('mongoose');

const streamSchema = new mongoose.Schema({
  // ── Core ──
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, maxlength: 500 },
  thumbnail: String,

  // ── Hosts ──
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  influencer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional co-host

  // ── Category & Products ──
  category: {
    type: String,
    enum: ['fashion', 'beauty', 'electronics', 'home', 'food', 'kids', 'sports', 'flash_sale', 'review', 'auction']
  },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    streamPrice: Number, // special price only during stream
    streamStock: Number, // limited qty for stream
    soldDuringStream: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false } // currently highlighted product
  }],

  // ── Agora Live Streaming ──
  agoraChannel: { type: String, unique: true, sparse: true },
  agoraToken: String,
  streamKey: String, // for RTMP streaming

  // ── Status ──
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled'
  },
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  duration: Number, // seconds

  // ── Stream Type ──
  type: {
    type: String,
    enum: ['regular', 'flash_sale', 'product_review', 'auction', 'q_and_a'],
    default: 'regular'
  },

  // ── Flash Sale Settings ──
  flashSale: {
    isActive: { type: Boolean, default: false },
    discountPercent: Number,
    endsAt: Date,
    maxOrders: Number
  },

  // ── Engagement Stats ──
  viewerCount: { type: Number, default: 0 },
  peakViewers: { type: Number, default: 0 },
  totalViews: { type: Number, default: 0 },
  uniqueViewers: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },

  // ── Sales Stats ──
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 }, // PKR
  conversionRate: { type: Number, default: 0 }, // %

  // ── Recording ──
  recordingUrl: String, // saved replay
  highlights: [String], // AI-generated highlight clips

  // ── Chat ──
  chatEnabled: { type: Boolean, default: true },
  chatMessages: { type: Number, default: 0 },
  pinnedMessage: String,

  // ── Tags & Discovery ──
  tags: [String],
  isPrivate: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },

  // ── Viewers Tracking ──
  viewers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: Date,
    leftAt: Date
  }]
}, {
  timestamps: true
});

streamSchema.index({ seller: 1 });
streamSchema.index({ status: 1 });
streamSchema.index({ scheduledAt: 1 });
streamSchema.index({ category: 1, status: 1 });
streamSchema.index({ isFeatured: 1, status: 1 });

// ── Virtual: Is Live ──
streamSchema.virtual('isLive').get(function() {
  return this.status === 'live';
});

module.exports = mongoose.model('Stream', streamSchema);
