const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Stream = require('../models/Stream');

// All admin routes require auth + admin role
router.use(protect, authorize('admin'));

// GET /api/admin/stats — dashboard overview
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers, totalSellers, totalBuyers, totalInfluencers,
      totalProducts, pendingProducts, approvedProducts,
      totalOrders, pendingOrders, deliveredOrders,
      totalStreams, liveStreams,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'seller', isActive: true }),
      User.countDocuments({ role: 'buyer', isActive: true }),
      User.countDocuments({ role: 'influencer', isActive: true }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true, isApproved: false }),
      Product.countDocuments({ isActive: true, isApproved: true }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      Stream.countDocuments(),
      Stream.countDocuments({ status: 'live' }),
    ]);

    const revenueAgg = await Order.aggregate([
      { $match: { status: { $in: ['delivered', 'confirmed'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Last 7 days orders
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentOrders = await Order.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      success: true, data: {
        users: { total: totalUsers, sellers: totalSellers, buyers: totalBuyers, influencers: totalInfluencers, recentSignups: recentUsers },
        products: { total: totalProducts, pending: pendingProducts, approved: approvedProducts },
        orders: { total: totalOrders, pending: pendingOrders, delivered: deliveredOrders, recentOrders },
        streams: { total: totalStreams, live: liveStreams },
        revenue: { total: totalRevenue },
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users — list all users
router.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    const users = await User.find(filter).select('-password -refreshToken').sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
    const total = await User.countDocuments(filter);
    res.json({ success: true, data: { users, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/users/:id — ban/unban user
router.patch('/users/:id', async (req, res) => {
  try {
    const { isActive, role } = req.body;
    const update = {};
    if (typeof isActive === 'boolean') update.isActive = isActive;
    if (role) update.role = role;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/products — list products (with pending filter)
router.get('/products', async (req, res) => {
  try {
    const { approved, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };
    if (approved === 'false') filter.isApproved = false;
    if (approved === 'true') filter.isApproved = true;
    const products = await Product.find(filter).populate('seller', 'name email city sellerProfile.storeName').sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Product.countDocuments(filter);
    res.json({ success: true, data: { products, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/admin/products/:id — approve/reject product
router.patch('/products/:id', async (req, res) => {
  try {
    const { isApproved, isActive } = req.body;
    const update = {};
    if (typeof isApproved === 'boolean') update.isApproved = isApproved;
    if (typeof isActive === 'boolean') update.isActive = isActive;
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/orders — list all orders
router.get('/orders', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const orders = await Order.find(filter).populate('buyer', 'name email phone city').populate('seller', 'name email').sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit));
    const total = await Order.countDocuments(filter);
    res.json({ success: true, data: { orders, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
