require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const analysisRoutes = require('./routes/analysis');
const stripeRoutes = require('./routes/stripe');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5050;

// Stripe webhook needs raw body — MUST be before express.json()
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Routes
app.use('/api/analysis', analysisRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AnalystAI Backend', version: '2.0.0' });
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   📊  AnalystAI Server v2.0              ║
  ║   Port: ${PORT}                             ║
  ║   Auth + History + Plan Limits Active    ║
  ╚══════════════════════════════════════════╝
  `);
});
