import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Client Supabase admin (bypass RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (userId && plan) {
          // Mettre à jour le profil utilisateur
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_plan: plan,
              analyses_count: 0, // Reset le compteur
            })
            .eq('id', userId)

          console.log(`✅ Subscription activated for user ${userId}: ${plan}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        const plan = subscription.metadata?.plan

        if (userId && plan) {
          const isActive = subscription.status === 'active'
          
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_plan: isActive ? plan : 'free',
            })
            .eq('id', userId)

          console.log(`✅ Subscription updated for user ${userId}: ${plan} (${subscription.status})`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (userId) {
          // Revenir au plan gratuit
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_plan: 'free',
            })
            .eq('id', userId)

          console.log(`✅ Subscription canceled for user ${userId}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}