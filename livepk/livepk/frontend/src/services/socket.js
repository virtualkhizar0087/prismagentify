import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(window.location.origin, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => console.log('🔌 Socket connected:', socket.id));
    socket.on('disconnect', (reason) => console.log('🔌 Socket disconnected:', reason));
    socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

// ── Stream helpers ──
export const joinStream = (streamId, userId, userName) => {
  getSocket().emit('join_stream', { streamId, userId, userName });
};

export const leaveStream = (streamId) => {
  getSocket().emit('leave_stream', { streamId });
};

export const sendChatMessage = (streamId, message, userId, userName) => {
  getSocket().emit('chat_message', { streamId, message, userId, userName });
};

export const likeStream = (streamId) => {
  getSocket().emit('like_stream', { streamId });
};

export const notifyOrderPlaced = (streamId, buyerName, productName, amount) => {
  getSocket().emit('order_placed', { streamId, buyerName, productName, amount });
};
