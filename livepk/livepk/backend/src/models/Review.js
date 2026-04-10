const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true, maxlength: 100 },
  comment: { type: String, trim: true, maxlength: 1000 },
  images: [String], // Cloudinary URLs

  // Quality attributes (1-5)
  qualityRating: { type: Number, min: 1, max: 5 },
  deliveryRating: { type: Number, min: 1, max: 5 },
  valueRating: { type: Number, min: 1, max: 5 },

  isVerifiedPurchase: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },

  // Helpful votes
  helpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  helpfulCount: { type: Number, default: 0 },

  sellerReply: {
    comment: String,
    repliedAt: Date
  }
}, { timestamps: true });

reviewSchema.index({ product: 1, buyer: 1 }, { unique: true }); // one review per product per buyer
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ seller: 1 });

// ── After save: update product rating ──
reviewSchema.post('save', async function () {
  const Product = mongoose.model('Product');
  const stats = await mongoose.model('Review').aggregate([
    { $match: { product: this.product, isApproved: true } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
