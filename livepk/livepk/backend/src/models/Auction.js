const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
  stream: { type: mongoose.Schema.Types.ObjectId, ref: 'Stream', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },

  title: { type: String, required: true, trim: true },
  description: String,
  images: [String],

  // Auction config
  startingPrice: { type: Number, required: true }, // PKR
  reservePrice: { type: Number }, // minimum acceptable price
  buyNowPrice: { type: Number }, // instant purchase price
  bidIncrement: { type: Number, default: 100 }, // PKR minimum bid step

  // Timing
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, default: 300 }, // seconds (5 min default)

  // Bids
  bids: [{
    bidder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bidderName: String,
    amount: { type: Number, required: true },
    placedAt: { type: Date, default: Date.now },
    isWinning: { type: Boolean, default: false }
  }],

  currentBid: { type: Number, default: 0 },
  currentWinner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentWinnerName: String,
  totalBids: { type: Number, default: 0 },

  // Status
  status: {
    type: String,
    enum: ['pending', 'live', 'ended', 'sold', 'no_sale', 'cancelled'],
    default: 'pending'
  },

  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  winningBid: Number,
  winningOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

  // Auto-extend: if bid placed in last 30s, extend by 30s
  autoExtend: { type: Boolean, default: true },
  extensionTime: { type: Number, default: 30 }, // seconds
  extensions: { type: Number, default: 0 } // how many times extended
}, { timestamps: true });

auctionSchema.index({ stream: 1, status: 1 });
auctionSchema.index({ seller: 1 });
auctionSchema.index({ endTime: 1 });

module.exports = mongoose.model('Auction', auctionSchema);
