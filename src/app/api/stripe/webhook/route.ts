import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Client Supabase admin (bypass RLS) — nécessaire car le webhook
// est appelé par Stripe, pas par un utilisateur authentifié
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper : récupérer le nombre d'analyses selon le plan
function getAnalysesLimit(plan: string): number {
  switch (plan) {
    case 'discovery': return 3
    case 'pro': return 10
    case 'unlimited': return -1
    default: return 1
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      // ─────────────────────────────────────────────
      // 1. CHECKOUT TERMINÉ — Premier abonnement
      // ─────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan

        if (!userId || !plan) {
          console.error('❌ Missing metadata in checkout session:', session.id)
          break
        }

        // Stocker le stripe_customer_id + activer le plan
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_plan: plan,
            analyses_count: 0,
            stripe_customer_id: session.customer as string,
          })
          .eq('id', userId)

        if (error) {
          console.error('❌ Supabase update error:', error)
          throw error
        }

        console.log(`✅ Subscription activated: user=${userId} plan=${plan}`)
        break
      }

      // ─────────────────────────────────────────────
      // 2. FACTURE PAYÉE — Renouvellement mensuel
      //    Reset le compteur d'analyses chaque mois
      // ─────────────────────────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        // Ignorer la première facture (déjà gérée par checkout.session.completed)
        if (invoice.billing_reason === 'subscription_create') {
          console.log('ℹ️ First invoice, skipping (handled by checkout)')
          break
        }

        const customerId = invoice.customer as string

        // Trouver l'utilisateur par son stripe_customer_id
        const { data: profile, error: fetchError } = await supabaseAdmin
          .from('profiles')
          .select('id, subscription_plan')
          .eq('stripe_customer_id', customerId)
          .single()

        if (fetchError || !profile) {
          console.error('❌ User not found for customer:', customerId)
          break
        }

        // Reset le compteur d'analyses
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ analyses_count: 0 })
          .eq('id', profile.id)

        if (error) {
          console.error('❌ Failed to reset analyses count:', error)
          throw error
        }

        console.log(`✅ Monthly renewal: user=${profile.id} plan=${profile.subscription_plan} — analyses reset`)
        break
      }

      // ─────────────────────────────────────────────
      // 3. PAIEMENT ÉCHOUÉ — Facture non payée
      //    Avertir (ou downgrader plus tard)
      // ─────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          // Pour l'instant on log — tu pourras ajouter un email d'alerte plus tard
          console.warn(`⚠️ Payment failed: user=${profile.id} customer=${customerId}`)
        }
        break
      }

      // ─────────────────────────────────────────────
      // 4. ABONNEMENT MIS À JOUR — Changement de plan
      // ─────────────────────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        const plan = subscription.metadata?.plan

        if (!userId || !plan) {
          console.error('❌ Missing metadata in subscription:', subscription.id)
          break
        }

        const isActive = ['active', 'trialing'].includes(subscription.status)

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_plan: isActive ? plan : 'free',
          })
          .eq('id', userId)

        if (error) {
          console.error('❌ Supabase update error:', error)
          throw error
        }

        console.log(`✅ Subscription updated: user=${userId} plan=${plan} status=${subscription.status}`)
        break
      }

      // ─────────────────────────────────────────────
      // 5. ABONNEMENT ANNULÉ — Retour au plan free
      // ─────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          // Fallback : chercher par customer_id
          const customerId = subscription.customer as string
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (profile) {
            await supabaseAdmin
              .from('profiles')
              .update({ subscription_plan: 'free' })
              .eq('id', profile.id)

            console.log(`✅ Subscription canceled (via customer_id): user=${profile.id}`)
          }
          break
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_plan: 'free',
          })
          .eq('id', userId)

        if (error) {
          console.error('❌ Supabase update error:', error)
          throw error
        }

        console.log(`✅ Subscription canceled: user=${userId}`)
        break
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}