import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer l'analyse
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Analyse non trouvée' },
        { status: 404 }
      )
    }

    // Récupérer les clauses
    const { data: clauses, error: clausesError } = await supabase
      .from('clauses')
      .select('*')
      .eq('analysis_id', id)

    if (clausesError) {
      console.error('Erreur récupération clauses:', clausesError)
    }

    return NextResponse.json({
      success: true,
      analysis,
      clauses: clauses || [],
    })

  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}