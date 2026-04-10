import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

// ══════════════════════════════════════════
// AUTH STORE
// ══════════════════════════════════════════
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,
      isAuthenticated: false,

      // Register
      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register', data);
          const { user, accessToken, refreshToken } = res.data.data;
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err.response?.data?.message || 'Registration failed.' };
        }
      },

      // Login
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = res.data.data;
          set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: err.response?.data?.message || 'Login failed.' };
        }
      },

      // Logout
      logout: async () => {
        try { await api.post('/auth/logout'); } catch {}
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      // Update user data
      updateUser: (data) => set(state => ({ user: { ...state.user, ...data } })),

      // Refresh profile
      refreshMe: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.data });
        } catch {}
      }
    }),
    {
      name: 'livepk-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// ══════════════════════════════════════════
// STREAM STORE
// ══════════════════════════════════════════
export const useStreamStore = create((set, get) => ({
  streams: [],
  currentStream: null,
  isLoading: false,
  viewerCount: 0,
  chatMessages: [],
  pinnedProduct: null,
  flashSale: null,
  isLive: false,

  fetchStreams: async (params = {}) => {
    set({ isLoading: true });
    try {
      const res = await api.get('/streams', { params });
      set({ streams: res.data.data.streams, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchStream: async (id) => {
    set({ isLoading: true });
    try {
      const res = await api.get(`/streams/${id}`);
      set({ currentStream: res.data.data, isLoading: false });
      return res.data.data;
    } catch {
      set({ isLoading: false });
    }
  },

  setViewerCount: (count) => set({ viewerCount: count }),

  addChatMessage: (msg) => set(state => ({
    chatMessages: [...state.chatMessages.slice(-99), msg]
  })),

  setPinnedProduct: (product) => set({ pinnedProduct: product }),
  setFlashSale: (sale) => set({ flashSale: sale }),
  setIsLive: (val) => set({ isLive: val }),
  clearStream: () => set({ currentStream: null, chatMessages: [], viewerCount: 0, pinnedProduct: null, flashSale: null })
}));

// ══════════════════════════════════════════
// CART STORE
// ══════════════════════════════════════════
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1, variant = null) => {
        const items = get().items;
        const key = `${product._id}-${variant?.value || 'default'}`;
        const existing = items.find(i => i.key === key);

        if (existing) {
          set({ items: items.map(i => i.key === key ? { ...i, quantity: i.quantity + quantity } : i) });
        } else {
          set({ items: [...items, { key, product, quantity, variant, addedAt: new Date() }] });
        }
      },

      removeItem: (key) => set(state => ({ items: state.items.filter(i => i.key !== key) })),

      updateQuantity: (key, qty) => {
        if (qty <= 0) { get().removeItem(key); return; }
        set(state => ({ items: state.items.map(i => i.key === key ? { ...i, quantity: qty } : i) }));
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set(state => ({ isOpen: !state.isOpen })),

      get totalItems() { return get().items.reduce((sum, i) => sum + i.quantity, 0); },
      get totalPrice() {
        return get().items.reduce((sum, i) => {
          const price = i.product.salePrice || i.product.price;
          return sum + (price * i.quantity);
        }, 0);
      }
    }),
    { name: 'livepk-cart' }
  )
);
