const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // ── Basic Info ──
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [60, 'Name too long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^(\+92|0)[0-9]{10}$/, 'Enter valid Pakistani phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },

  // ── Role ──
  // buyer     = regular shopper
  // seller    = store/brand owner listing products
  // influencer = content creator who promotes products
  // admin     = platform admin
  role: {
    type: String,
    enum: ['buyer', 'seller', 'influencer', 'admin'],
    default: 'buyer'
  },

  // ── Profile ──
  avatar: { type: String, default: null },
  bio: { type: String, maxlength: 200 },
  city: {
    type: String,
    enum: ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
           'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Other'],
    default: 'Lahore'
  },

  // ── Seller Profile (populated if role=seller) ──
  sellerProfile: {
    storeName: String,
    storeDescription: String,
    storeLogo: String,
    storeBanner: String,
    category: {
      type: String,
      enum: ['fashion', 'beauty', 'electronics', 'home', 'food', 'kids', 'sports', 'other']
    },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalSales: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }, // PKR
    commissionRate: { type: Number, default: 8 }, // % taken by platform
    bankDetails: {
      bankName: String,
      accountTitle: String,
      accountNumber: String, // stored encrypted in production
      iban: String
    }
  },

  // ── Influencer Profile (populated if role=influencer) ──
  influencerProfile: {
    handle: String, // @username
    niche: {
      type: String,
      enum: ['fashion', 'beauty', 'lifestyle', 'tech', 'food', 'fitness', 'parenting', 'general']
    },
    platforms: [{
      name: { type: String, enum: ['tiktok', 'instagram', 'youtube', 'facebook'] },
      username: String,
      followers: Number,
      url: String
    }],
    isVerified: { type: Boolean, default: false },
    totalEarnings: { type: Number, default: 0 }, // PKR
    commissionRate: { type: Number, default: 10 }, // % influencer earns per sale
    tier: {
      type: String,
      enum: ['nano', 'micro', 'macro', 'mega'],
      default: 'nano'
      // nano: <10K, micro: 10K-100K, macro: 100K-1M, mega: 1M+
    }
  },

  // ── Account Status ──
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },

  // ── Wallet (PKR balance on platform) ──
  walletBalance: { type: Number, default: 0 }, // PKR

  // ── Tokens ──
  refreshToken: { type: String, select: false },
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  phoneOTP: String,
  phoneOTPExpires: Date,

  // ── Notifications ──
  notificationPreferences: {
    orderUpdates: { type: Boolean, default: true },
    newStreams: { type: Boolean, default: true },
    promotions: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: true },
    sms: { type: Boolean, default: true }
  },

  // ── Timestamps ──
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ── Indexes ──
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'sellerProfile.isVerified': 1 });

// ── Pre-save: Hash Password ──
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Method: Compare Password ──
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Virtual: Full Avatar URL ──
userSchema.virtual('avatarUrl').get(function() {
  if (!this.avatar) return null;
  return this.avatar.startsWith('http') ? this.avatar : `/uploads/${this.avatar}`;
});

// ── Method: Safe public profile ──
userSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    avatar: this.avatarUrl,
    bio: this.bio,
    city: this.city,
    isVerified: this.isVerified,
    sellerProfile: this.role === 'seller' ? {
      storeName: this.sellerProfile?.storeName,
      storeDescription: this.sellerProfile?.storeDescription,
      storeLogo: this.sellerProfile?.storeLogo,
      category: this.sellerProfile?.category,
      isVerified: this.sellerProfile?.isVerified,
      rating: this.sellerProfile?.rating,
      totalSales: this.sellerProfile?.totalSales
    } : undefined,
    influencerProfile: this.role === 'influencer' ? {
      handle: this.influencerProfile?.handle,
      niche: this.influencerProfile?.niche,
      platforms: this.influencerProfile?.platforms,
      isVerified: this.influencerProfile?.isVerified,
      tier: this.influencerProfile?.tier
    } : undefined,
    walletBalance: this.walletBalance,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('User', userSchema);
