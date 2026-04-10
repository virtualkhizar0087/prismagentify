const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Stream = require('../models/Stream');
const Product = require('../models/Product');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// ── GET /api/analytics/seller ── Seller dashboard analytics
router.get('/seller', protect, authorize('seller'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const sellerId = req.user._id;

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Revenue over time (daily breakdown)
    const revenueByDay = await Order.aggregate([
      { $match: { seller: sellerId, createdAt: { $gte: startDate }, status: { $nin: ['cancelled', 'returned', 'refunded'] } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$sellerAmount' },
        orders: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Total stats
    const totals = await Order.aggregate([
      { $match: { seller: sellerId, status: { $nin: ['cancelled', 'returned', 'refunded'] } } },
      { $group: {
        _id: null,
        totalRevenue: { $sum: '$sellerAmount' },
        totalOrders: { $sum: 1 },
        totalItems: { $sum: { $size: '$items' } }
      }}
    ]);

    // Recent period stats
    const periodStats = await Order.aggregate([
      { $match: { seller: sellerId, createdAt: { $gte: startDate }, status: { $nin: ['cancelled', 'returned', 'refunded'] } } },
      { $group: {
        _id: null,
        revenue: { $sum: '$sellerAmount' },
        orders: { $sum: 1 }
      }}
    ]);

    // Top products
    const topProducts = await Order.aggregate([
      { $match: { seller: sellerId, createdAt: { $gte: startDate } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.product',
        productName: { $first: '$items.productName' },
        sold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.total' }
      }},
      { $sort: { revenue: -1 } },
      { $limit: 5 }
    ]);

    // Order status breakdown
    const ordersByStatus = await Order.aggregate([
      { $match: { seller: sellerId, createdAt: { $gte: startDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Stream performance
    const streamStats = await Stream.aggregate([
      { $match: { seller: sellerId, createdAt: { $gte: startDate } } },
      { $group: {
        _id: null,
        totalStreams: { $sum: 1 },
        totalViewers: { $sum: '$totalViews' },
        totalRevenue: { $sum: '$totalRevenue' },
        avgViewers: { $avg: '$peakViewers' }
      }}
    ]);

    // Payment method breakdown
    const paymentBreakdown = await Order.aggregate([
      { $match: { seller: sellerId, createdAt: { $gte: startDate } } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$sellerAmount' } } }
    ]);

    // City-wise orders
    const cityBreakdown = await Order.aggregate([
      { $match: { seller: sellerId, createdAt: { $gte: startDate } } },
      { $group: { _id: '$shippingAddress.city', orders: { $sum: 1 } } },
      { $sort: { orders: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        period,
        totals: totals[0] || { totalRevenue: 0, totalOrders: 0, totalItems: 0 },
        periodStats: periodStats[0] || { revenue: 0, orders: 0 },
        revenueByDay,
        topProducts,
        ordersByStatus,
        streamStats: streamStats[0] || {},
        paymentBreakdown,
        cityBreakdown
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
});

// ── GET /api/analytics/stream/:streamId ── Stream analytics
router.get('/stream/:streamId', protect, async (req, res) => {
  try {
    const stream = await Stream.findById(req.params.streamId);
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found.' });

    if (stream.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const orders = await Order.find({ stream: req.params.streamId, status: { $nin: ['cancelled', 'returned'] } })
      .populate('items.product', 'name');

    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const pid = item.product?._id?.toString() || item.product?.toString();
        if (!productSales[pid]) productSales[pid] = { name: item.productName, qty: 0, revenue: 0 };
        productSales[pid].qty += item.quantity;
        productSales[pid].revenue += item.total;
      });
    });

    res.json({
      success: true,
      data: {
        streamId: stream._id,
        title: stream.title,
        duration: stream.duration,
        viewerCount: stream.totalViews,
        peakViewers: stream.peakViewers,
        uniqueViewers: stream.uniqueViewers,
        likes: stream.likes,
        shares: stream.shares,
        chatMessages: stream.chatMessages,
        totalOrders: stream.totalOrders,
        totalRevenue: stream.totalRevenue,
        conversionRate: stream.conversionRate,
        productSales: Object.values(productSales)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stream analytics.' });
  }
});

// ── GET /api/analytics/admin ── Admin platform analytics
router.get('/admin', protect, authorize('admin'), async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalUsers, newUsers, totalOrders, platformRevenue,
      activeStreams, totalProducts
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Order.countDocuments({ createdAt: { $gte: startDate } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $nin: ['cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$platformFee' } } }
      ]),
      Stream.countDocuments({ status: 'live' }),
      Product.countDocuments({ isActive: true, isApproved: true })
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        period,
        totalUsers,
        newUsers,
        totalOrders,
        platformRevenue: platformRevenue[0]?.total || 0,
        activeStreams,
        totalProducts,
        usersByRole
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin analytics.' });
  }
});

module.exports = router;
