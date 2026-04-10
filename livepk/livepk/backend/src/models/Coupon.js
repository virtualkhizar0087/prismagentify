const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: String,

  type: {
    type: String,
    enum: ['percent', 'fixed', 'free_shipping'],
    required: true
  },
  value: { type: Number, required: true }, // % or PKR amount

  // Who created it
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creatorRole: { type: String, enum: ['seller', 'admin'] },

  // Restrictions
  minOrderAmount: { type: Number, default: 0 }, // PKR
  maxDiscount: { type: Number }, // max PKR cap for percent coupons
  applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // empty = all
  applicableCategories: [String], // empty = all

  // Usage limits
  usageLimit: { type: Number, default: null }, // null = unlimited
  usageLimitPerUser: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Validity
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },

  // Stream-specific coupon
  stream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' },
  isStreamOnly: { type: Boolean, default: false }
}, { timestamps: true });

couponSchema.index({ code: 1 });
couponSchema.index({ expiresAt: 1 });
couponSchema.index({ createdBy: 1 });

// ── Method: Validate coupon for an order ──
couponSchema.methods.isValidFor = function(userId, orderAmount) {
  const now = new Date();
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive.' };
  if (now < this.startsAt) return { valid: false, reason: 'Coupon not yet active.' };
  if (now > this.expiresAt) return { valid: false, reason: 'Coupon has expired.' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) return { valid: false, reason: 'Coupon usage limit reached.' };
  if (orderAmount < this.minOrderAmount) return { valid: false, reason: `Minimum order amount is PKR ${this.minOrderAmount}.` };
  const userUsed = this.usedBy.filter(id => id.toString() === userId.toString()).length;
  if (userUsed >= this.usageLimitPerUser) return { valid: false, reason: 'You have already used this coupon.' };
  return { valid: true };
};

// ── Method: Calculate discount ──
couponSchema.methods.calculateDiscount = function(orderAmount) {
  if (this.type === 'percent') {
    const discount = (orderAmount * this.value) / 100;
    return this.maxDiscount ? Math.min(discount, this.maxDiscount) : discount;
  }
  if (this.type === 'fixed') return Math.min(this.value, orderAmount);
  if (this.type === 'free_shipping') return 0; // handled separately
  return 0;
};

module.exports = mongoose.model('Coupon', couponSchema);
