import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
});

// ── Request Interceptor: attach token ──
api.interceptors.request.use(
  (config) => {
    // Get token from persisted zustand store
    try {
      const stored = JSON.parse(localStorage.getItem('livepk-auth') || '{}');
      const token = stored?.state?.accessToken;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor: handle 401 ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const stored = JSON.parse(localStorage.getItem('livepk-auth') || '{}');
        const refreshToken = stored?.state?.refreshToken;

        if (refreshToken) {
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          const { accessToken } = res.data.data;

          // Update stored token
          stored.state.accessToken = accessToken;
          localStorage.setItem('livepk-auth', JSON.stringify(stored));

          original.headers.Authorization = `Bearer ${accessToken}`;
          return api(original);
        }
      } catch {
        // Refresh failed — force logout
        localStorage.removeItem('livepk-auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ══════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/update-profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
};

// ══════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getMyProducts: () => api.get('/products/seller/my-products'),
  uploadImages: (formData) => api.post('/products/upload-images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// ══════════════════════════════════════════
// STREAMS
// ══════════════════════════════════════════
export const streamAPI = {
  getAll: (params) => api.get('/streams', { params }),
  getOne: (id) => api.get(`/streams/${id}`),
  create: (data) => api.post('/streams', data),
  goLive: (id) => api.post(`/streams/${id}/go-live`),
  end: (id) => api.post(`/streams/${id}/end`),
  pinProduct: (id, data) => api.patch(`/streams/${id}/pin-product`, data),
  getAgoraToken: (id) => api.get(`/streams/${id}/agora-token`),
  getMyStreams: () => api.get('/streams/my-streams'),
};

// ══════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
};

// ══════════════════════════════════════════
// REVIEWS
// ══════════════════════════════════════════
export const reviewAPI = {
  getForProduct: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  create: (data) => api.post('/reviews', data),
  update: (id, data) => api.put(`/reviews/${id}`, data),
  delete: (id) => api.delete(`/reviews/${id}`),
  markHelpful: (id) => api.post(`/reviews/${id}/helpful`),
  sellerReply: (id, comment) => api.post(`/reviews/${id}/seller-reply`, { comment }),
};

// ══════════════════════════════════════════
// WISHLIST
// ══════════════════════════════════════════
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  add: (productId) => api.post(`/wishlist/${productId}`),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
  check: (productId) => api.get(`/wishlist/check/${productId}`),
  clear: () => api.delete('/wishlist'),
};

// ══════════════════════════════════════════
// COUPONS
// ══════════════════════════════════════════
export const couponAPI = {
  validate: (data) => api.post('/coupons/validate', data),
  getMy: () => api.get('/coupons/my'),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
};

// ══════════════════════════════════════════
// AUCTIONS
// ══════════════════════════════════════════
export const auctionAPI = {
  getForStream: (streamId) => api.get(`/auctions/stream/${streamId}`),
  getOne: (id) => api.get(`/auctions/${id}`),
  create: (data) => api.post('/auctions', data),
  placeBid: (id, amount) => api.post(`/auctions/${id}/bid`, { amount }),
  buyNow: (id) => api.post(`/auctions/${id}/buy-now`),
  start: (id) => api.patch(`/auctions/${id}/start`),
  end: (id) => api.patch(`/auctions/${id}/end`),
};

// ══════════════════════════════════════════
// ANALYTICS
// ══════════════════════════════════════════
export const analyticsAPI = {
  getSeller: (params) => api.get('/analytics/seller', { params }),
  getStream: (streamId) => api.get(`/analytics/stream/${streamId}`),
  getAdmin: (params) => api.get('/analytics/admin', { params }),
};

// ══════════════════════════════════════════
// PAYMENTS
// ══════════════════════════════════════════
export const paymentAPI = {
  jazzCash: (data) => api.post('/payments/jazzcash', data),
  easypaisa: (data) => api.post('/payments/easypaisa', data),
};

// ══════════════════════════════════════════
// SELLERS
// ══════════════════════════════════════════
export const sellerAPI = {
  getDashboard: () => api.get('/sellers/dashboard'),
  getOrders: (params) => api.get('/sellers/orders', { params }),
  updateOrderStatus: (id, data) => api.put(`/sellers/orders/${id}/status`, data),
};

// ══════════════════════════════════════════
// UPLOAD (Avatar, Store assets, Stream thumbnail)
// ══════════════════════════════════════════
export const uploadAPI = {
  avatar: (formData) => api.post('/users/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  storeAssets: (formData) => api.post('/sellers/upload-assets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  streamThumbnail: (streamId, formData) => api.post(`/streams/${streamId}/upload-thumbnail`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};
