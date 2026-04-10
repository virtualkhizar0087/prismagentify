/**
 * LivePK — Claude AI Service
 * Powered by Anthropic's Claude API
 * 
 * Features:
 * - Urdu/English product descriptions
 * - Fraud detection scoring
 * - Live stream chat moderation
 * - Smart product recommendations
 * - COD risk assessment
 */

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// ══════════════════════════════════════════
// 1. Generate Product Description
//    (Bilingual: English + Urdu)
// ══════════════════════════════════════════
exports.generateProductDescription = async (productData) => {
  const { name, category, price, features, sellerNotes } = productData;

  const prompt = `You are a product copywriter for LivePK, Pakistan's premier live commerce platform.

Generate compelling product descriptions for the following product. 
Write in a style that appeals to Pakistani buyers - warm, trustworthy, value-focused.

Product Details:
- Name: ${name}
- Category: ${category}
- Price: PKR ${price}
- Features/Notes from seller: ${features || sellerNotes || 'Not provided'}

Please provide:
1. A short English description (2-3 sentences, persuasive, highlight value for money)
2. A short Urdu description (same content translated to Urdu script - اردو)
3. Five relevant search tags in English (comma separated)
4. A quality score from 0-100 based on how complete and sellable this product seems

Respond in JSON format:
{
  "descriptionEn": "...",
  "descriptionUr": "...",
  "tags": ["tag1", "tag2", ...],
  "qualityScore": 75,
  "qualityNotes": "brief note on what would improve this listing"
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  throw new Error('Failed to parse AI response');
};

// ══════════════════════════════════════════
// 2. Fraud/Risk Assessment for COD Orders
// ══════════════════════════════════════════
exports.assessOrderFraud = async (orderData) => {
  const { buyer, order, history } = orderData;

  const prompt = `You are a fraud detection system for LivePK, a Pakistani e-commerce platform.

Analyze this COD (Cash on Delivery) order and provide a risk score.

Order Details:
- Order Total: PKR ${order.totalAmount}
- Payment Method: ${order.paymentMethod}
- Delivery City: ${order.shippingAddress?.city}
- Province: ${order.shippingAddress?.province}
- Buyer Account Age: ${history?.accountAgeDays || 'new'} days
- Previous Orders: ${history?.totalOrders || 0}
- Previous Returns/Cancellations: ${history?.cancelledOrders || 0}
- Phone Verified: ${buyer?.phoneVerified ? 'Yes' : 'No'}
- Email Verified: ${buyer?.emailVerified ? 'Yes' : 'No'}
- Cart Items Count: ${order.items?.length || 1}

Pakistani e-commerce context:
- COD fraud is common (fake orders, refusing delivery)
- New accounts with large orders are higher risk
- Multiple items in first order is a risk signal
- Unverified phone numbers increase risk

Respond in JSON:
{
  "fraudScore": 25,
  "riskLevel": "low|medium|high",
  "flags": ["list of specific concerns"],
  "recommendation": "approve|review|reject",
  "reason": "brief explanation"
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return { fraudScore: 50, riskLevel: 'medium', recommendation: 'review', flags: [] };
};

// ══════════════════════════════════════════
// 3. Moderate Live Stream Chat Message
// ══════════════════════════════════════════
exports.moderateChat = async (message, context) => {
  const prompt = `You are a content moderator for LivePK, Pakistan's live commerce platform.

Check this chat message for violations. Be culturally sensitive to Pakistani norms.

Message: "${message}"
Stream Category: ${context?.category || 'general'}

Flag if the message contains:
- Spam or repeated messages
- Offensive language (Urdu or English)
- Off-platform contact sharing (phone numbers, WhatsApp links to bypass platform)
- Hate speech or harassment
- Fake reviews or competitor promotion
- Inappropriate content

Respond in JSON:
{
  "isAllowed": true,
  "violationType": null,
  "reason": null
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return { isAllowed: true };
};

// ══════════════════════════════════════════
// 4. Generate Stream Title & Description
// ══════════════════════════════════════════
exports.generateStreamContent = async (streamData) => {
  const { category, products, sellerName, type } = streamData;

  const productList = products?.map(p => p.name).join(', ') || 'various products';

  const prompt = `Create an engaging live stream title and description for a Pakistani e-commerce live stream.

Stream Info:
- Seller: ${sellerName}
- Category: ${category}
- Type: ${type || 'product showcase'}
- Products: ${productList}

Pakistani live commerce style: energetic, create urgency, mention deals and value.

Respond in JSON:
{
  "titleEn": "catchy English title under 60 chars",
  "titleUr": "same in Urdu",
  "descriptionEn": "2 sentence description",
  "descriptionUr": "Urdu description",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  throw new Error('Failed to generate stream content');
};

// ══════════════════════════════════════════
// 5. Buyer Support Chatbot (Urdu/English)
// ══════════════════════════════════════════
exports.buyerSupport = async (question, context) => {
  const systemPrompt = `You are a helpful customer support agent for LivePK, Pakistan's leading live commerce platform.

You help buyers with:
- Order tracking and status
- Return and refund policies
- Payment issues (COD, JazzCash, Easypaisa)
- Delivery questions
- How to buy during a live stream
- Account issues

Platform policies:
- COD is available nationwide
- Returns accepted within 7 days for most products
- Delivery takes 2-5 days within major cities, 5-7 days for remote areas
- JazzCash/Easypaisa payments get 5% discount
- Customer service: support@livepk.pk

Respond in the same language as the question (Urdu or English).
Be warm, helpful, and concise. Max 3 sentences.`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: 'user', content: question }]
  });

  return response.content[0].text;
};

// ══════════════════════════════════════════
// 6. Generate Stream Performance Report
// ══════════════════════════════════════════
exports.generateStreamReport = async (streamStats) => {
  const prompt = `Analyze this live stream performance for a Pakistani e-commerce seller and give actionable insights.

Stream Stats:
- Duration: ${streamStats.duration} minutes
- Peak Viewers: ${streamStats.peakViewers}
- Total Views: ${streamStats.totalViews}
- Orders: ${streamStats.totalOrders}
- Revenue: PKR ${streamStats.totalRevenue}
- Conversion Rate: ${streamStats.conversionRate}%
- Chat Messages: ${streamStats.chatMessages}
- Category: ${streamStats.category}

Provide a JSON response:
{
  "overallScore": 72,
  "summary": "2-sentence summary",
  "strengths": ["what went well"],
  "improvements": ["specific actionable tips for next stream"],
  "nextStreamTips": ["3 specific tips for Pakistan market"]
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return JSON.parse(jsonMatch[0]);
  throw new Error('Failed to generate report');
};
