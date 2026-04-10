const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now },
    notifyOnSale: { type: Boolean, default: true }
  }]
}, { timestamps: true });

wishlistSchema.index({ buyer: 1 });
wishlistSchema.index({ 'items.product': 1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
