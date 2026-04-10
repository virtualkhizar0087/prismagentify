import Stripe from 'stripe'
import type { Plan } from '@/types/database'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia' as any,
  typescript: true,
})

export const PLANS = {
  starter: {
    name: 'Starter',
    price: 149,
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    callLimit: 500,
    agentLimit: 1,
    features: [
      '500 calls/month',
      '1 AI agent',
      '1 phone number',
      'Call transcripts',
      'Email support',
      '14-day free trial',
    ],
  },
  pro: {
    name: 'Pro',
    price: 299,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    callLimit: 2000,
    agentLimit: 3,
    features: [
      '2,000 calls/month',
      '3 AI agents',
      '3 phone numbers',
      'Call transcripts + recordings',
      'SMS summaries after each call',
      'Priority support',
      '14-day free trial',
    ],
  },
  agency: {
    name: 'Agency',
    price: 599,
    priceId: process.env.STRIPE_AGENCY_PRICE_ID!,
    callLimit: -1,
    agentLimit: 10,
    features: [
      'Unlimited calls',
      '10 AI agents',
      '10 phone numbers',
      'White-label dashboard',
      'Custom branding',
      'Dedicated account manager',
      'API access',
      '14-day free trial',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS

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
  return stripe.checkout.sessions.create({
    customer_email: userEmail,
    client_reference_id: userId,
    mode: 'subscription',
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    subscription_data: { metadata: { userId, plan } },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  })
}

export async function createPortalSession({
  stripeCustomerId,
  returnUrl,
}: {
  stripeCustomerId: string
  returnUrl: string
}) {
  return stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })
}

export function getPlanFromPriceId(priceId: string): Plan {
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return 'starter'
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) return 'agency'
  return 'free'
}

export function getCallLimit(plan: Plan): number {
  if (plan === 'free') return 50
  return PLANS[plan as PlanKey]?.callLimit ?? 50
}
