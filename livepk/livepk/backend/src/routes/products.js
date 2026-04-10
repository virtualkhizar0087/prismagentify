const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadProductImages } = require('../middleware/upload');
const Product = require('../models/Product');
const aiService = require('../services/aiService');

// GET /api/products — browse products with full filtering
router.get('/', async (req, res) => {
  try {
    const {
      category, search, page = 1, limit = 20, sort = '-createdAt',
      minPrice, maxPrice, city, freeShipping, codAvailable, rating
    } = req.query;

    const filter = { isActive: true, isApproved: true };
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }
    if (freeShipping === 'true') filter.freeShipping = true;
    if (codAvailable === 'true') filter.codAvailable = true;
    if (rating) filter.rating = { $gte: parseFloat(rating) };

    const products = await Product.find(filter)
      .populate('seller', 'name avatar sellerProfile.storeName sellerProfile.rating city')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);
    res.json({ success: true, data: { products, total } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get products.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name avatar sellerProfile city');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    await Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get product.' });
  }
});

// POST /api/products/upload-images — upload product images to Cloudinary
router.post('/upload-images', protect, authorize('seller'), (req, res) => {
  uploadProductImages(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'No images provided.' });
    const urls = req.files.map(f => f.path);
    res.json({ success: true, message: `${urls.length} image(s) uploaded.`, data: { urls } });
  });
});

// POST /api/products — seller creates product
router.post('/', protect, authorize('seller'), async (req, res) => {
  try {
    const productData = { ...req.body, seller: req.user._id };

    // AI-enhance description if Anthropic key is set
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
      try {
        const aiResult = await aiService.generateProductDescription({
          name: productData.name,
          category: productData.category,
          price: productData.price,
          features: productData.description
        });
        productData.descriptionUrdu = aiResult.descriptionUr;
        if (!productData.description) productData.description = aiResult.descriptionEn;
        if (!productData.tags?.length) productData.tags = aiResult.tags;
        productData.aiQualityScore = aiResult.qualityScore;
      } catch (aiErr) {
        console.warn('AI enhancement skipped:', aiErr.message);
      }
    }

    const product = await Product.create(productData);
    res.status(201).json({ success: true, message: 'Product created! Pending approval.', data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to create product.' });
  }
});

// PUT /api/products/:id — update product
router.put('/:id', protect, authorize('seller'), async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, seller: req.user._id };
    const product = await Product.findOneAndUpdate(filter, { isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: 'Product removed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete product.' });
  }
});

// GET /api/products/seller/my-products
router.get('/seller/my-products', protect, authorize('seller'), async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get products.' });
  }
});

module.exports = router;
