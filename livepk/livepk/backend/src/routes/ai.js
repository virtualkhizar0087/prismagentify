const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const aiService = require('../services/aiService');

// ── Generate Product Description ──
router.post('/product-description', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const result = await aiService.generateProductDescription(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI generation failed. Check your API key.' });
  }
});

// ── Stream Content Generation ──
router.post('/stream-content', protect, authorize('seller', 'influencer', 'admin'), async (req, res) => {
  try {
    const result = await aiService.generateStreamContent({
      ...req.body,
      sellerName: req.user.sellerProfile?.storeName || req.user.name
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'AI generation failed.' });
  }
});

// ── Buyer Support Chatbot ──
router.post('/support', async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'Question required.' });
    const answer = await aiService.buyerSupport(question, context);
    res.json({ success: true, data: { answer } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Support unavailable.' });
  }
});

// ── Stream Performance Report ──
router.post('/stream-report', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const result = await aiService.generateStreamReport(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Report generation failed.' });
  }
});

// ── Moderate Chat Message ──
router.post('/moderate-chat', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message required.' });
    const result = await aiService.moderateChat(message, context);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Moderation failed.' });
  }
});

module.exports = router;
