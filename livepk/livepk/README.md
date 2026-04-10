# LivePK 🔴 — Pakistan Live Commerce Platform
## Complete Setup & Development Guide

---

## 🗂️ Project Structure

```
livepk/
├── backend/                    ← Node.js + Express API
│   ├── src/
│   │   ├── index.js           ← Server entry point
│   │   ├── models/
│   │   │   ├── User.js        ← Buyers, Sellers, Influencers
│   │   │   ├── Product.js     ← Products with variants
│   │   │   ├── Stream.js      ← Live streams
│   │   │   └── Order.js       ← Orders with COD support
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── streamController.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── streams.js
│   │   │   ├── products.js
│   │   │   ├── orders.js
│   │   │   ├── sellers.js
│   │   │   ├── influencers.js
│   │   │   └── ai.js          ← Claude AI endpoints
│   │   ├── middleware/
│   │   │   └── auth.js        ← JWT protect + authorize
│   │   ├── services/
│   │   │   ├── aiService.js   ← Claude AI integration
│   │   │   └── socketHandler.js ← Real-time features
│   │   └── utils/
│   │       └── database.js    ← MongoDB connection
│   ├── .env.example
│   └── package.json
│
└── frontend/                   ← React Web App
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.jsx             ← Router + protected routes
    │   ├── index.js
    │   ├── index.css           ← Global design system
    │   ├── store/
    │   │   └── index.js       ← Zustand: Auth, Stream, Cart
    │   ├── services/
    │   │   ├── api.js          ← Axios + auto token refresh
    │   │   └── socket.js       ← Socket.IO client
    │   ├── pages/
    │   │   ├── HomePage.jsx           ← Live stream feed
    │   │   ├── StreamPage.jsx         ← Full live viewing experience
    │   │   ├── LoginPage.jsx          ← Login + Register
    │   │   ├── RegisterPage.jsx
    │   │   ├── SellerDashboard.jsx    ← Go Live, Products, Orders
    │   │   ├── InfluencerDashboard.jsx ← Earnings, Streams
    │   │   ├── BuyerOrders.jsx        ← Order tracking
    │   │   ├── ProductPage.jsx        ← Product detail + cart
    │   │   ├── CheckoutPage.jsx       ← COD + JazzCash checkout
    │   │   └── NotFoundPage.jsx
    │   └── components/
    │       ├── layout/
    │       │   └── Navbar.jsx
    │       └── buyer/
    │           └── CartDrawer.jsx
    └── package.json
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+ — download from nodejs.org
- MongoDB — use MongoDB Atlas free tier (cloud) OR install locally
- Anthropic API Key — get from console.anthropic.com
- Agora account (for real live video) — get from agora.io

---

### Step 1: Configure Backend

```bash
cd livepk/backend
cp .env.example .env
```

Edit `.env` and fill in:
```
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster.mongodb.net/livepk
ANTHROPIC_API_KEY=sk-ant-...your key here...
AGORA_APP_ID=your_agora_app_id
JWT_SECRET=make_this_a_long_random_string_like_this_abc123xyz
```

```bash
npm install
npm run dev
```
✅ Backend runs on http://localhost:5000

---

### Step 2: Start Frontend

```bash
cd livepk/frontend
npm install
npm start
```
✅ Frontend runs on http://localhost:3000

---

### Step 3: Test the Platform

**As a Buyer:**
1. Go to http://localhost:3000
2. Register as a buyer
3. Browse live streams on homepage
4. Click a stream, watch chat, add products to cart
5. Checkout with COD

**As a Seller:**
1. Register as a seller
2. Go to /seller/products → Add products (AI will auto-generate Urdu descriptions)
3. Go to /seller/go-live → Create a stream
4. Click "Go Live" → share the stream URL

**As an Influencer:**
1. Register as an influencer
2. Go to /influencer/products → Pick products to promote
3. Join a seller's live stream as co-host
4. Earn commission on every sale made through your stream

---

## 🤖 Claude AI Features

| Feature | Endpoint | What it does |
|---------|----------|-------------|
| Product descriptions | POST /api/ai/product-description | Generates English + Urdu descriptions |
| Stream title generator | POST /api/ai/stream-content | Creates engaging stream titles in both languages |
| COD Fraud detection | Auto (on order placement) | Scores 0-100, flags suspicious COD orders |
| Chat moderation | POST /api/ai/moderate-chat | Blocks spam, off-platform contact sharing |
| Buyer support bot | POST /api/ai/support | Answers buyer questions in Urdu/English |
| Stream report | POST /api/ai/stream-report | Analyzes stream performance after ending |

---

## 📡 Real-Time Socket Events

| Event (Client → Server) | Purpose |
|--------------------------|---------|
| `join_stream` | Join a live stream room |
| `leave_stream` | Leave the room |
| `chat_message` | Send a chat message |
| `like_stream` | Like the stream |
| `pin_product` | Pin a product (seller only) |
| `flash_sale_start` | Start a flash sale alert |
| `order_placed` | Notify room of a purchase |

| Event (Server → Client) | Purpose |
|--------------------------|---------|
| `viewer_update` | Updated live viewer count |
| `chat_message` | New chat message |
| `system_message` | Join/leave announcements |
| `product_pinned` | Product now featured |
| `flash_sale_alert` | Flash sale started |
| `order_notification` | Someone bought something! |

---

## 💳 Payment Methods Supported

| Method | Status | Notes |
|--------|--------|-------|
| Cash on Delivery (COD) | ✅ Full | AI fraud scoring on each order |
| JazzCash | ✅ Manual | Instructions shown to buyer |
| Easypaisa | ✅ Manual | Instructions shown to buyer |
| Bank Transfer | ✅ Manual | Account details shown |
| Platform Wallet | ✅ Balance system | For seller/influencer payouts |

> Production: Integrate JazzCash REST API and Easypaisa API for automated payment verification

---

## 🔗 API Endpoints

### Auth
```
POST /api/auth/register   — Create account
POST /api/auth/login      — Login
POST /api/auth/refresh    — Refresh token
POST /api/auth/logout     — Logout
GET  /api/auth/me         — Get current user
PUT  /api/auth/update-profile — Update profile
```

### Streams
```
GET    /api/streams              — Browse streams (live/scheduled)
GET    /api/streams/:id          — Single stream
POST   /api/streams              — Create stream (seller)
POST   /api/streams/:id/go-live  — Start streaming
POST   /api/streams/:id/end      — End stream
PATCH  /api/streams/:id/pin-product — Pin product during stream
GET    /api/streams/my-streams   — Seller's streams
```

### Products
```
GET    /api/products              — Browse products
GET    /api/products/:id          — Single product
POST   /api/products              — Create product (seller)
PUT    /api/products/:id          — Update product
DELETE /api/products/:id          — Remove product
GET    /api/products/seller/my-products
```

### Orders
```
POST   /api/orders                — Place order (buyer)
GET    /api/orders/my-orders      — Buyer's orders
GET    /api/orders/seller/orders  — Seller's incoming orders
GET    /api/orders/:id            — Single order
PATCH  /api/orders/:id/status     — Update status (seller)
```

---

## 🏗️ Next Modules to Build

1. **Admin Panel** — user/seller approval, analytics dashboard, fraud review
2. **React Native Mobile App** — iOS + Android for buyers and sellers
3. **Real Agora Integration** — replace placeholder with actual video SDK
4. **JazzCash/Easypaisa API** — automated payment confirmation
5. **Push Notifications** — Firebase FCM for order updates
6. **WhatsApp Business API** — order confirmations via WhatsApp
7. **Search & Discovery** — Elasticsearch for product/stream search
8. **Auction Module** — real-time bidding during live streams
9. **Referral System** — invite friends, earn credits
10. **Analytics Dashboard** — seller insights, heatmaps, conversion funnels

---

## 💰 Cost to Run (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| MongoDB Atlas | M0 Free → M2 $9 | Free start |
| AWS / Railway | Basic | ~$5–20 |
| Agora.io | 10,000 min free | Free start |
| Anthropic API | Pay per use | ~$10–50 |
| Domain (.pk) | Annual | PKR 1,500/yr |
| **Total MVP** | | **~PKR 5,000/mo** |

---

Built with ❤️ for Pakistan · Powered by Claude AI
