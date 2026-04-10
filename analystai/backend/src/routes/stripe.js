const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');
const { updateUserPlan, getUserByEmail } = require('../lib/supabase');

const PLANS = {
  starter: {
    name: 'Starter',
    price: 1900,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
    features: ['5 AI analyses per day', 'All 11 modules', 'Analysis history'],
  },
  pro: {
    name: 'Pro',
    price: 4900,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ['Unlimited AI analyses', 'All 11 modules', 'Priority support', 'Analysis history'],
  },
  enterprise: {
    name: 'Enterprise',
    price: 19900,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: ['Everything in Pro', 'White-label', 'Team access', 'API access'],
  },
};

// GET plan info (public)
router.get('/plans', (req, res) => {
  res.json({ success: true, plans: PLANS });
});

// Create checkout session (requires auth)
router.post('/create-checkout', auth, async (req, res) => {
  try {
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Invalid plan' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: req.user.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `AnalystAI ${PLANS[plan].name}`,
            description: `Institutional-grade AI financial analysis — ${PLANS[plan].name} plan`,
          },
          unit_amount: PLANS[plan].price,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
      metadata: { plan, userId: req.user.id },
      allow_promotion_codes: true,
    });

    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Activate plan after successful payment (called from Success page)
router.post('/activate', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, error: 'Payment not completed' });
    }

    const plan = session.metadata?.plan;
    await updateUserPlan(req.user.id, plan, session.customer, session.subscription);

    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify session (public — just reads payment status)
router.get('/verify-session/:sessionId', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    res.json({
      success: true,
      paid: session.payment_status === 'paid',
      plan: session.metadata?.plan,
      customer: session.customer_email,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create billing portal session (requires auth + active subscription)
router.post('/billing-portal', auth, async (req, res) => {
  try {
    const { supabase } = require('../lib/supabase');
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', req.user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ success: false, error: 'No active subscription found. Please subscribe first.' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/app/settings`,
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error('Billing portal error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Stripe webhook (raw body mounted in index.js before express.json)
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const obj = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed': {
      const userId = obj.metadata?.userId;
      const plan = obj.metadata?.plan;
      if (userId && plan) {
        await updateUserPlan(userId, plan, obj.customer, obj.subscription);
        console.log(`✅ Plan activated: ${plan} for user ${userId}`);
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const user = obj.customer_email ? await getUserByEmail(obj.customer_email) : null;
      if (user) {
        await updateUserPlan(user.id, 'free', obj.customer, null);
        console.log(`❌ Subscription cancelled → free: ${obj.customer_email}`);
      }
      break;
    }
    case 'invoice.payment_failed':
      console.log(`⚠️ Payment failed: ${obj.customer_email}`);
      break;
    default:
      break;
  }

  res.json({ received: true });
});

module.exports = router;
