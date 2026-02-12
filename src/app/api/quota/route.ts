import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  discovery: 3,
  pro: 10,
  unlimited: -1, // -1 = illimité
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer le profil
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('analyses_count, subscription_plan, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        { error: 'Profil non trouvé' },
        { status: 404 }
      )
    }

    const plan = profile.subscription_plan || 'free'
    const limit = PLAN_LIMITS[plan] || 1
    const used = profile.analyses_count || 0
    const remaining = limit === -1 ? -1 : Math.max(0, limit - used)
    const canAnalyze = limit === -1 || used < limit

    // Vérifier si le trial est expiré
    const trialExpired = profile.trial_ends_at 
      ? new Date(profile.trial_ends_at) < new Date()
      : false

    return NextResponse.json({
      success: true,
      quota: {
        plan,
        limit,
        used,
        remaining,
        canAnalyze: canAnalyze && !trialExpired,
        trialExpired,
        trialEndsAt: profile.trial_ends_at,
      },
    })

  } catch (error) {
    console.error('Erreur quota:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}