import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
})

export const PLANS = {
  discovery: {
    name: 'Découverte',
    price: 12,
    priceId: process.env.STRIPE_PRICE_DISCOVERY!,
    analyses: 3,
  },
  pro: {
    name: 'Pro',
    price: 19,
    priceId: process.env.STRIPE_PRICE_PRO!,
    analyses: 10,
  },
  unlimited: {
    name: 'Illimité',
    price: 29,
    priceId: process.env.STRIPE_PRICE_UNLIMITED!,
    analyses: -1,
  },
} as const

export type PlanKey = keyof typeof PLANS
