import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS, PlanKey } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json()

    // Vérifier que le plan existe
    if (!plan || !PLANS[plan as PlanKey]) {
      return NextResponse.json(
        { error: 'Plan invalide' },
        { status: 400 }
      )
    }

    // Vérifier l'authentification
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const selectedPlan = PLANS[plan as PlanKey]
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Créer la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/subscription?success=true&plan=${plan}`,
      cancel_url: `${appUrl}/subscription?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: plan,
        },
      },
    })

    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Erreur Stripe checkout:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création du paiement' },
      { status: 500 }
    )
  }
}