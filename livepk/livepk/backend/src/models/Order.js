const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // ── Reference ──
  orderNumber: { type: String, unique: true }, // e.g., PK-2024-00001
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream' }, // if from live stream
  influencer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // attribution

  // ── Items ──
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: String, // snapshot at time of order
    productImage: String,
    variant: {
      name: String,
      value: String
    },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true }, // PKR at time of order
    streamPrice: Number, // special stream price if applicable
    total: Number
  }],

  // ── Pricing Summary (PKR) ──
  subtotal: { type: Number, required: true },
  shippingCost: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  promoCode: String,
  platformFee: { type: Number, default: 0 }, // platform commission
  influencerCommission: { type: Number, default: 0 }, // influencer's cut
  sellerAmount: { type: Number }, // what seller actually receives
  totalAmount: { type: Number, required: true },

  // ── Delivery Address ──
  shippingAddress: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    province: {
      type: String,
      enum: ['Punjab', 'Sindh', 'KPK', 'Balochistan', 'AJK', 'Gilgit-Baltistan'],
      required: true
    },
    postalCode: String,
    landmark: String // important in Pakistan - "near mosque", "behind plaza"
  },

  // ── Payment ──
  paymentMethod: {
    type: String,
    enum: ['cod', 'jazzcash', 'easypaisa', 'bank_transfer', 'wallet'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partial_refund'],
    default: 'pending'
  },
  paymentReference: String, // transaction ID from payment gateway
  paidAt: Date,

  // ── Order Status ──
  status: {
    type: String,
    enum: [
      'placed',       // order just placed
      'confirmed',    // seller confirmed
      'processing',   // being prepared
      'packed',       // ready for pickup
      'dispatched',   // handed to courier
      'in_transit',   // on the way
      'out_for_delivery',
      'delivered',    // successfully delivered
      'return_requested',
      'returned',
      'cancelled',
      'refunded'
    ],
    default: 'placed'
  },

  // ── Logistics ──
  courierName: {
    type: String,
    enum: ['leopards', 'tcs', 'mAndP', 'postex', 'blueEx', 'trax', 'self']
  },
  trackingNumber: String,
  trackingUrl: String,
  estimatedDelivery: Date,
  deliveredAt: Date,

  // ── COD Specific ──
  codConfirmed: { type: Boolean, default: false }, // phone confirmation done
  codAmount: Number, // amount to collect on delivery

  // ── Status History ──
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],

  // ── Fraud Detection ──
  fraudScore: { type: Number, default: 0 }, // 0-100, Claude AI generated
  fraudFlags: [String],
  requiresVerification: { type: Boolean, default: false },

  // ── Notes ──
  buyerNote: String,
  sellerNote: String,
  adminNote: String,

  // ── Returns ──
  returnReason: String,
  returnImages: [String],
  refundAmount: Number,
  refundedAt: Date

}, {
  timestamps: true
});

orderSchema.index({ buyer: 1 });
orderSchema.index({ seller: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ stream: 1 });
orderSchema.index({ createdAt: -1 });

// ── Pre-save: Generate Order Number ──
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `PK-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
