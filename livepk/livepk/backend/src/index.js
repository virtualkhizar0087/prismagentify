/**
 * LivePK — Pakistan Live Commerce Platform
 * Main Server Entry Point
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');
const connectDB = require('./utils/database');
const socketHandler = require('./services/socketHandler');

// ── Route Imports ──
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const streamRoutes = require('./routes/streams');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const sellerRoutes = require('./routes/sellers');
const influencerRoutes = require('./routes/influencers');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');
// ── New Feature Routes ──
const reviewRoutes = require('./routes/reviews');
const couponRoutes = require('./routes/coupons');
const wishlistRoutes = require('./routes/wishlist');
const auctionRoutes = require('./routes/auctions');
const analyticsRoutes = require('./routes/analytics');
const paymentService = require('./services/paymentService');

const app = express();
app.set('trust proxy', 1); // Fix express-rate-limit X-Forwarded-For warning
const server = http.createServer(app);

// ── Socket.IO Setup ──
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// ── Database Connection ──
connectDB();

// ── Security Middleware ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ── CORS ──
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// ── Rate Limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ── Auth Rate Limiting (stricter) ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later.' }
});

// ── Body Parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ──
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Static Files ──
app.use('/uploads', express.static('uploads'));

// ── Health Check ──
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    platform: 'LivePK',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ── API Routes ──
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
// ── New Feature Routes ──
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentService.createPaymentRoutes());

// ── Socket.IO Handler ──
socketHandler(io);

// ── 404 Handler ──
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ── Start Server ──
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║     🔴 LIVE  LivePK Server           ║
  ║     Port: ${PORT}                       ║
  ║     Env:  ${process.env.NODE_ENV || 'development'}              ║
  ║     Pakistan Live Commerce Platform  ║
  ╚══════════════════════════════════════╝
  `);
});

module.exports = { app, io };

 
