const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // ── Core ──
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  nameUrdu: { type: String, trim: true }, // AI-generated Urdu name
  description: { type: String, required: true, maxlength: 2000 },
  descriptionUrdu: { type: String, maxlength: 2000 }, // AI-generated
  category: {
    type: String,
    required: true,
    enum: ['fashion', 'beauty', 'electronics', 'home', 'food', 'kids', 'sports', 'other']
  },
  subcategory: String,
  tags: [String],

  // ── Pricing (PKR) ──
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, min: 0 },
  costPrice: { type: Number, min: 0 }, // private, not shown to buyers
  currency: { type: String, default: 'PKR' },

  // ── Inventory ──
  stock: { type: Number, required: true, min: 0, default: 0 },
  sku: { type: String, trim: true },
  variants: [{
    name: String, // e.g., "Size", "Color"
    options: [{
      value: String, // e.g., "M", "Red"
      price: Number,
      stock: Number,
      sku: String
    }]
  }],

  // ── Media ──
  images: [String], // array of image URLs/paths
  thumbnail: String,
  videoUrl: String,

  // ── Shipping ──
  weight: Number, // grams
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  shippingCost: { type: Number, default: 0 },
  freeShipping: { type: Boolean, default: false },
  codAvailable: { type: Boolean, default: true }, // Cash on Delivery

  // ── Commission ──
  influencerCommission: { type: Number, default: 10 }, // % for influencers
  platformCommission: { type: Number, default: 8 }, // % for LivePK

  // ── Performance ──
  totalSold: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },

  // ── Status ──
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false }, // admin approval required
  isFeatured: { type: Boolean, default: false },
  aiQualityScore: { type: Number, min: 0, max: 100 }, // Claude AI quality check

  // ── Live Stream Integration ──
  featuredInStreams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stream' }],
  streamSales: { type: Number, default: 0 },
}, {
  timestamps: true
});

productSchema.index({ seller: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1, isApproved: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

// ── Virtual: Current Price ──
productSchema.virtual('currentPrice').get(function() {
  return this.salePrice && this.salePrice < this.price ? this.salePrice : this.price;
});

// ── Virtual: Discount % ──
productSchema.virtual('discountPercent').get(function() {
  if (!this.salePrice || this.salePrice >= this.price) return 0;
  return Math.round(((this.price - this.salePrice) / this.price) * 100);
});

module.exports = mongoose.model('Product', productSchema);
