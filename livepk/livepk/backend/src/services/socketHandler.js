/**
 * LivePK — Real-Time Socket Handler
 * Powers: Live chat, viewer counts, flash sale alerts, order notifications
 */

const Stream = require('../models/Stream');
const aiService = require('./aiService');
// Auction and Gift models loaded lazily to avoid circular deps

module.exports = (io) => {
  // Track active rooms
  const activeRooms = new Map(); // streamId -> { viewers: Set, messages: [] }

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── JOIN STREAM ROOM ──
    socket.on('join_stream', async ({ streamId, userId, userName }) => {
      try {
        socket.join(streamId);
        socket.data.streamId = streamId;
        socket.data.userId = userId;
        socket.data.userName = userName || 'Viewer';

        // Init room tracking
        if (!activeRooms.has(streamId)) {
          activeRooms.set(streamId, { viewers: new Set(), messages: [] });
        }
        activeRooms.get(streamId).viewers.add(socket.id);

        const viewerCount = activeRooms.get(streamId).viewers.size;

        // Update DB viewer count
        await Stream.findByIdAndUpdate(streamId, {
          $inc: { uniqueViewers: 1, totalViews: 1 },
          $set: { viewerCount },
          $max: { peakViewers: viewerCount }
        });

        // Broadcast updated count to room
        io.to(streamId).emit('viewer_update', { count: viewerCount });

        // Welcome message
        io.to(streamId).emit('system_message', {
          message: `${socket.data.userName} joined the stream 👋`,
          type: 'join'
        });

        console.log(`👁️ ${userName} joined stream ${streamId} (${viewerCount} viewers)`);
      } catch (err) {
        console.error('join_stream error:', err);
      }
    });

    // ── LEAVE STREAM ROOM ──
    socket.on('leave_stream', async ({ streamId }) => {
      await handleLeaveStream(socket, streamId, io, activeRooms);
    });

    // ── SEND CHAT MESSAGE ──
    socket.on('chat_message', async ({ streamId, message, userId, userName }) => {
      try {
        if (!message?.trim()) return;

        // AI moderation (non-blocking)
        aiService.moderateChat(message, { category: 'general' })
          .then(result => {
            if (!result.isAllowed) {
              socket.emit('message_blocked', {
                reason: result.reason || 'Message not allowed'
              });
              return;
            }

            const chatMessage = {
              id: Date.now(),
              userId,
              userName: userName || 'Viewer',
              message: message.trim(),
              timestamp: new Date(),
              type: 'user'
            };

            // Store in memory (use Redis in production)
            if (activeRooms.has(streamId)) {
              const room = activeRooms.get(streamId);
              room.messages.push(chatMessage);
              if (room.messages.length > 100) room.messages.shift(); // keep last 100
            }

            // Broadcast to room
            io.to(streamId).emit('chat_message', chatMessage);

            // Increment chat count in DB
            Stream.findByIdAndUpdate(streamId, { $inc: { chatMessages: 1 } }).exec();
          })
          .catch(() => {
            // If AI fails, still send the message
            io.to(streamId).emit('chat_message', {
              id: Date.now(), userId, userName,
              message: message.trim(), timestamp: new Date(), type: 'user'
            });
          });

      } catch (err) {
        console.error('chat_message error:', err);
      }
    });

    // ── LIKE STREAM ──
    socket.on('like_stream', async ({ streamId }) => {
      try {
        await Stream.findByIdAndUpdate(streamId, { $inc: { likes: 1 } });
        const stream = await Stream.findById(streamId, 'likes');
        io.to(streamId).emit('like_update', { likes: stream.likes });
      } catch (err) {
        console.error('like_stream error:', err);
      }
    });

    // ── PIN PRODUCT (seller action) ──
    socket.on('pin_product', ({ streamId, product }) => {
      // Broadcast pinned product to all viewers
      io.to(streamId).emit('product_pinned', {
        product,
        message: `🛍️ Now featuring: ${product.name}`
      });
    });

    // ── FLASH SALE ALERT ──
    socket.on('flash_sale_start', ({ streamId, discount, duration, productName }) => {
      io.to(streamId).emit('flash_sale_alert', {
        discount,
        duration,
        productName,
        endsAt: new Date(Date.now() + duration * 1000),
        message: `🔥 FLASH SALE! ${discount}% OFF ${productName} for next ${duration / 60} minutes!`
      });
    });

    // ── ORDER PLACED (notify stream) ──
    socket.on('order_placed', ({ streamId, buyerName, productName, amount }) => {
      io.to(streamId).emit('order_notification', {
        buyerName: buyerName || 'Someone',
        productName,
        amount,
        message: `🎉 ${buyerName || 'Someone'} just ordered ${productName}!`
      });
    });

    // ── SEND GIFT/TIP ──
    socket.on('send_gift', ({ streamId, giftType, senderName, value }) => {
      io.to(streamId).emit('gift_received', {
        giftType,
        senderName,
        value,
        message: `🎁 ${senderName} sent a ${giftType}!`
      });
    });

    // ── STREAM ENDED (host broadcasts) ──
    socket.on('stream_ended', ({ streamId }) => {
      io.to(streamId).emit('stream_ended', {
        message: 'Stream has ended. Thank you for watching! 🙏'
      });
    });

    // ── AUCTION: START ──
    socket.on('auction_start', ({ streamId, auction }) => {
      io.to(streamId).emit('auction_started', {
        auction,
        message: `🔨 LIVE AUCTION STARTED! Starting bid: PKR ${auction.startingPrice?.toLocaleString()}`
      });
    });

    // ── AUCTION: NEW BID (real-time broadcast) ──
    socket.on('auction_bid', ({ streamId, auctionId, bidder, amount, totalBids, endTime }) => {
      io.to(streamId).emit('auction_bid_update', {
        auctionId, bidder, amount, totalBids, endTime,
        message: `🔨 ${bidder} bid PKR ${amount?.toLocaleString()}!`
      });
    });

    // ── AUCTION: COUNTDOWN ──
    socket.on('auction_countdown', ({ streamId, auctionId, secondsLeft }) => {
      io.to(streamId).emit('auction_countdown', { auctionId, secondsLeft });
    });

    // ── AUCTION: ENDED ──
    socket.on('auction_end', ({ streamId, auctionId, winner, winningBid }) => {
      io.to(streamId).emit('auction_ended', {
        auctionId, winner, winningBid,
        message: winner
          ? `🏆 Auction ended! ${winner} won with PKR ${winningBid?.toLocaleString()}!`
          : `Auction ended with no winner.`
      });
    });

    // ── GIFT: Broadcast with animation ──
    socket.on('send_gift', ({ streamId, giftType, senderName, value, giftEmoji }) => {
      io.to(streamId).emit('gift_received', {
        giftType, senderName, value,
        giftEmoji: giftEmoji || '🎁',
        message: `${giftEmoji || '🎁'} ${senderName} sent a ${giftType}! (PKR ${value})`
      });
      // Update stream revenue from gifts
      Stream.findByIdAndUpdate(streamId, { $inc: { totalRevenue: value } }).exec();
    });

    // ── SELLER: Pin/highlight product ──
    socket.on('highlight_product', ({ streamId, product, streamPrice }) => {
      io.to(streamId).emit('product_highlighted', {
        product, streamPrice,
        message: `🛍️ ${product.name} — Stream Price: PKR ${streamPrice || product.price}!`
      });
    });

    // ── FLASH SALE: Countdown tick ──
    socket.on('flash_sale_tick', ({ streamId, secondsLeft, discount, productName }) => {
      io.to(streamId).emit('flash_sale_tick', { secondsLeft, discount, productName });
    });

    // ── DISCONNECT ──
    socket.on('disconnect', async () => {
      const streamId = socket.data.streamId;
      if (streamId) {
        await handleLeaveStream(socket, streamId, io, activeRooms);
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

// ── Helper: Handle leaving stream ──
async function handleLeaveStream(socket, streamId, io, activeRooms) {
  try {
    socket.leave(streamId);
    if (activeRooms.has(streamId)) {
      activeRooms.get(streamId).viewers.delete(socket.id);
      const viewerCount = activeRooms.get(streamId).viewers.size;
      if (viewerCount === 0) activeRooms.delete(streamId);

      await Stream.findByIdAndUpdate(streamId, { $set: { viewerCount } });
      io.to(streamId).emit('viewer_update', { count: viewerCount });
    }
  } catch (err) {
    console.error('leave_stream error:', err);
  }
}
