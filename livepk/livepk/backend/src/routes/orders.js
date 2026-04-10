const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const aiService = require('../services/aiService');

// POST /api/orders — place an order
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, streamId, influencerId, promoCode } = req.body;

    if (!items?.length) return res.status(400).json({ success: false, message: 'Order items required.' });
    if (!shippingAddress) return res.status(400).json({ success: false, message: 'Shipping address required.' });

    // Calculate totals
    let subtotal = 0;
    const orderItems = [];
    let sellerRef = null;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product not available: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for: ${product.name}` });
      }

      const price = product.salePrice || product.price;
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;
      sellerRef = product.seller;

      orderItems.push({
        product: product._id,
        productName: product.name,
        productImage: product.thumbnail,
        quantity: item.quantity,
        unitPrice: price,
        total: itemTotal,
        variant: item.variant
      });
    }

    const shippingCost = subtotal >= 2000 ? 0 : 200; // Free shipping above PKR 2000
    const platformFee = Math.round(subtotal * 0.08); // 8% platform commission
    const influencerCommission = influencerId ? Math.round(subtotal * 0.10) : 0;
    const sellerAmount = subtotal - platformFee - influencerCommission;
    const totalAmount = subtotal + shippingCost;

    // Build order data
    const orderData = {
      buyer: req.user._id,
      seller: sellerRef,
      stream: streamId || null,
      influencer: influencerId || null,
      items: orderItems,
      subtotal,
      shippingCost,
      platformFee,
      influencerCommission,
      sellerAmount,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      codAmount: paymentMethod === 'cod' ? totalAmount : 0,
      statusHistory: [{ status: 'placed', note: 'Order placed by buyer' }]
    };

    // AI Fraud Check for COD orders
    if (paymentMethod === 'cod' && process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
      try {
        const buyerHistory = await Order.aggregate([
          { $match: { buyer: req.user._id } },
          { $group: { _id: null, total: { $sum: 1 }, cancelled: { $sum: { $cond: [{ $in: ['$status', ['cancelled', 'returned']] }, 1, 0] } } } }
        ]);
        const hist = buyerHistory[0] || { total: 0, cancelled: 0 };

        const fraud = await aiService.assessOrderFraud({
          buyer: req.user,
          order: orderData,
          history: {
            accountAgeDays: Math.floor((Date.now() - req.user.createdAt) / 86400000),
            totalOrders: hist.total,
            cancelledOrders: hist.cancelled
          }
        });

        orderData.fraudScore = fraud.fraudScore;
        orderData.fraudFlags = fraud.flags;
        orderData.requiresVerification = fraud.recommendation !== 'approve';
      } catch (err) {
        console.warn('Fraud check skipped:', err.message);
      }
    }

    const order = await Order.create(orderData);

    // Send WhatsApp OTP/confirmation for COD orders
    if (order.paymentMethod === 'cod' || order.paymentMethod === 'cash_on_delivery') {
      try {
        const whatsappService = require('../services/whatsappService');
        const phone = order.shippingAddress?.phone || req.user.phone;
        if (phone) {
          await whatsappService.sendCODConfirmation(phone, {
            _id: order._id,
            orderNumber: order.orderNumber || order._id.toString().slice(-8).toUpperCase(),
            totalAmount: order.totalAmount,
            shippingAddress: order.shippingAddress,
            items: order.items
          });
        }
      } catch (waErr) {
        console.log('WhatsApp notification skipped:', waErr.message);
      }
    }

    // Reduce stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity, totalSold: item.quantity } });
    }

    await order.populate('items.product', 'name thumbnail');

    res.status(201).json({
      success: true,
      message: paymentMethod === 'cod'
        ? '✅ Order placed! Our team will confirm your order shortly.'
        : '✅ Order placed! Complete payment to confirm.',
      data: {
        order,
        requiresVerification: order.requiresVerification,
        fraudScore: order.fraudScore
      }
    });
  } catch (err) {
    console.error('Order error:', err);
    res.status(500).json({ success: false, message: 'Failed to place order.' });
  }
});

// GET /api/orders/my-orders — buyer's orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { buyer: req.user._id };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('items.product', 'name thumbnail price')
      .populate('seller', 'name sellerProfile.storeName')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);
    res.json({ success: true, data: { orders, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get orders.' });
  }
});

// GET /api/orders/seller/orders — seller's incoming orders
router.get('/seller/orders', protect, authorize('seller'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { seller: req.user._id };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('buyer', 'name phone city')
      .populate('items.product', 'name thumbnail')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    // Summary stats
    const stats = await Order.aggregate([
      { $match: { seller: req.user._id } },
      { $group: {
        _id: null,
        totalRevenue: { $sum: '$sellerAmount' },
        totalOrders: { $sum: 1 },
        pendingOrders: { $sum: { $cond: [{ $in: ['$status', ['placed', 'confirmed']] }, 1, 0] } }
      }}
    ]);

    res.json({ success: true, data: { orders, total, stats: stats[0] || {} } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get orders.' });
  }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('buyer', 'name phone email')
      .populate('seller', 'name sellerProfile.storeName phone')
      .populate('items.product');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Only buyer or seller can view
    const isBuyer = order.buyer._id.toString() === req.user._id.toString();
    const isSeller = order.seller._id.toString() === req.user._id.toString();
    if (!isBuyer && !isSeller && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get order.' });
  }
});

// PATCH /api/orders/:id/status — seller updates order status
router.patch('/:id/status', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const { status, note, trackingNumber, courierName } = req.body;
    const validTransitions = {
      placed: ['confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['packed'],
      packed: ['dispatched'],
      dispatched: ['in_transit'],
      in_transit: ['out_for_delivery'],
      out_for_delivery: ['delivered'],
      return_requested: ['returned'],
    };

    const order = await Order.findOne({
      _id: req.params.id,
      ...(req.user.role !== 'admin' && { seller: req.user._id })
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Cannot move from ${order.status} to ${status}.` });
    }

    order.status = status;
    order.statusHistory.push({ status, note, updatedBy: req.user._id });
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (courierName) order.courierName = courierName;
    if (status === 'delivered') order.deliveredAt = new Date();

    await order.save();
    res.json({ success: true, message: `Order updated to: ${status}`, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update order.' });
  }
});

// ── POST /api/orders/:id/return — Buyer requests a return
router.post('/:id/return', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Return reason required.' });

    const order = await Order.findOne({ _id: req.params.id, buyer: req.user._id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Returns only allowed for delivered orders.' });
    }
    if (order.returnRequested) {
      return res.status(400).json({ success: false, message: 'Return already requested for this order.' });
    }

    order.status = 'return_requested';
    order.returnRequested = true;
    order.returnReason = reason;
    order.returnRequestedAt = new Date();
    order.statusHistory.push({ status: 'return_requested', note: `Return reason: ${reason}`, updatedBy: req.user._id });
    await order.save();

    res.json({ success: true, message: 'Return request submitted. Seller will review within 48 hours.', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Return request failed.' });
  }
});

module.exports = router;
