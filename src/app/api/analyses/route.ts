import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les analyses de l'utilisateur
    const { data: analyses, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur récupération analyses:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des analyses' },
        { status: 500 }
      )
    }

    // Récupérer le profil pour le quota
    const { data: profile } = await supabase
      .from('profiles')
      .select('analyses_count, subscription_plan, trial_ends_at')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      analyses: analyses || [],
      profile: profile || null,
    })

  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}