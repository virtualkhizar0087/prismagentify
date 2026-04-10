import Stripe from 'stripe'
import type { Plan } from '@/types/database'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

// ============================================================
// PLAN CONFIGURATION
// ============================================================

export const PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    features: [
      '25 contract analyses/month',
      '50 AI chat messages/month',
      'NDA & basic document generation',
      'Email support',
    ],
    limits: {
      contracts: 25,
      conversations: 50,
      teamMembers: 1,
    },
  },
  pro: {
    name: 'Pro',
    price: 99,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: [
      '100 contract analyses/month',
      '200 AI chat messages/month',
      'All document types',
      'Risk scoring & red flags',
      'Priority support',
    ],
    limits: {
      contracts: 100,
      conversations: 200,
      teamMembers: 3,
    },
  },
  team: {
    name: 'Team',
    price: 299,
    priceId: process.env.STRIPE_TEAM_PRICE_ID!,
    features: [
      'Unlimited contract analyses',
      'Unlimited AI chat',
      'All document types',
      'Team collaboration (up to 10)',
      'Custom templates',
      'Dedicated support',
    ],
    limits: {
      contracts: -1,
      conversations: -1,
      teamMembers: 10,
    },
  },
} as const

export type PlanKey = keyof typeof PLANS

// ============================================================
// STRIPE HELPERS
// ============================================================

export async function createCheckoutSession({
  userId,
  userEmail,
  plan,
  successUrl,
  cancelUrl,
}: {
  userId: string
  userEmail: string
  plan: PlanKey
  successUrl: string
  cancelUrl: string
}) {
  const planConfig = PLANS[plan]

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    mode: 'subscription',
    line_items: [
      {
        price: planConfig.priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        userId,
        plan,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  })

  return session
}

export async function createPortalSession({
  stripeCustomerId,
  returnUrl,
}: {
  stripeCustomerId: string
  returnUrl: string
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })

  return session
}

export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId)
}

// Maps Stripe price IDs → plan names
export function getPlanFromPriceId(priceId: string): Plan {
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return 'starter'
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.STRIPE_TEAM_PRICE_ID) return 'team'
  return 'free'
}
