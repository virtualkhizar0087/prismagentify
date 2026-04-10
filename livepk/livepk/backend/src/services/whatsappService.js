/**
 * LivePK — WhatsApp / SMS Service
 * Uses Twilio for WhatsApp messages and SMS
 * Pakistan-focused: COD confirmations, order updates, OTP
 */

const twilio = require('twilio');

const getClient = () => {
  if (!process.env.TWILIO_SID || !process.env.TWILIO_TOKEN) {
    console.warn('Twilio not configured — WhatsApp/SMS disabled');
    return null;
  }
  return twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
};

// ── Format Pakistani phone for Twilio ──
const formatPkPhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\s|-/g, '');
  if (cleaned.startsWith('+92')) return cleaned;
  if (cleaned.startsWith('0')) return '+92' + cleaned.slice(1);
  return '+92' + cleaned;
};

// ══════════════════════════════════════════
// Send WhatsApp Message
// ══════════════════════════════════════════
const sendWhatsApp = async (to, message) => {
  const client = getClient();
  if (!client) return { success: false, reason: 'Twilio not configured' };

  try {
    const formatted = formatPkPhone(to);
    if (!formatted) return { success: false, reason: 'Invalid phone number' };

    const msg = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE}`,
      to: `whatsapp:${formatted}`,
      body: message
    });

    return { success: true, sid: msg.sid };
  } catch (error) {
    console.error('WhatsApp send error:', error.message);
    return { success: false, reason: error.message };
  }
};

// ── Send SMS (fallback) ──
const sendSMS = async (to, message) => {
  const client = getClient();
  if (!client) return { success: false, reason: 'Twilio not configured' };

  try {
    const formatted = formatPkPhone(to);
    if (!formatted) return { success: false, reason: 'Invalid phone number' };

    const msg = await client.messages.create({
      from: process.env.TWILIO_PHONE,
      to: formatted,
      body: message
    });

    return { success: true, sid: msg.sid };
  } catch (error) {
    console.error('SMS send error:', error.message);
    return { success: false, reason: error.message };
  }
};

// ══════════════════════════════════════════
// COD Confirmation WhatsApp
// ══════════════════════════════════════════
exports.sendCODConfirmation = async (phone, order) => {
  const message = `🛍️ *LivePK - Order Confirmation*\n\n` +
    `Order #${order.orderNumber} confirmed!\n\n` +
    `📦 Items: ${order.items.map(i => i.productName).join(', ')}\n` +
    `💰 Amount to pay on delivery: *PKR ${order.totalAmount?.toLocaleString()}*\n` +
    `📍 Delivery to: ${order.shippingAddress?.city}\n\n` +
    `Reply *YES* to confirm or *NO* to cancel.\n\n` +
    `Track your order: ${process.env.FRONTEND_URL}/orders/${order._id}`;

  return sendWhatsApp(phone, message);
};

// ══════════════════════════════════════════
// Order Status Update
// ══════════════════════════════════════════
exports.sendOrderUpdate = async (phone, order, statusMessage) => {
  const statusEmoji = {
    confirmed: '✅',
    processing: '⚙️',
    packed: '📦',
    dispatched: '🚚',
    in_transit: '🛣️',
    out_for_delivery: '🏠',
    delivered: '🎉',
    cancelled: '❌'
  };

  const emoji = statusEmoji[order.status] || '📋';
  const message = `${emoji} *LivePK - Order Update*\n\n` +
    `Order #${order.orderNumber}\n` +
    `Status: *${order.status.toUpperCase().replace(/_/g, ' ')}*\n\n` +
    `${statusMessage || ''}\n\n` +
    `Track: ${process.env.FRONTEND_URL}/orders/${order._id}`;

  return sendWhatsApp(phone, message);
};

// ══════════════════════════════════════════
// Phone OTP
// ══════════════════════════════════════════
exports.sendPhoneOTP = async (phone, otp) => {
  const message = `*${otp}* is your LivePK verification code.\n\nValid for 10 minutes. Do not share this code with anyone.\n\n🔴 LivePK Pakistan`;

  // Try WhatsApp first, fallback to SMS
  const whatsappResult = await sendWhatsApp(phone, message);
  if (whatsappResult.success) return whatsappResult;
  return sendSMS(phone, message);
};

// ══════════════════════════════════════════
// Stream Go-Live Notification
// ══════════════════════════════════════════
exports.sendStreamNotification = async (phone, sellerName, streamTitle) => {
  const message = `🔴 *${sellerName} is now LIVE on LivePK!*\n\n` +
    `"${streamTitle}"\n\n` +
    `Watch now & grab exclusive deals: ${process.env.FRONTEND_URL}`;

  return sendWhatsApp(phone, message);
};

// ══════════════════════════════════════════
// Flash Sale Alert
// ══════════════════════════════════════════
exports.sendFlashSaleAlert = async (phone, discount, productName, endsAt) => {
  const message = `🔥 *FLASH SALE on LivePK!*\n\n` +
    `${discount}% OFF on *${productName}*\n` +
    `⏰ Ends at: ${new Date(endsAt).toLocaleTimeString('en-PK')}\n\n` +
    `Shop now: ${process.env.FRONTEND_URL}`;

  return sendWhatsApp(phone, message);
};
