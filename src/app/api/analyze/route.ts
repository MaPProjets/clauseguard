import { NextRequest, NextResponse } from 'next/server'
import { claude, CLAUDE_MODEL, MAX_TOKENS } from '@/lib/claude'
import { SYSTEM_PROMPT, buildAnalysisPrompt, AnalysisResult } from '@/lib/prompts'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, filename, fileType } = body

    // Validation
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Texte du contrat manquant' },
        { status: 400 }
      )
    }

    if (text.length < 100) {
      return NextResponse.json(
        { error: 'Contrat trop court pour être analysé' },
        { status: 400 }
      )
    }

    // Vérifier l'authentification
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Appel Claude API
    const response = await claude.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: buildAnalysisPrompt(text),
        },
      ],
      system: SYSTEM_PROMPT,
    })

    // Extraction de la réponse
    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Réponse Claude invalide')
    }

    // Parse du JSON
    let analysis: AnalysisResult
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Pas de JSON trouvé dans la réponse')
      }
      analysis = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Erreur parsing JSON:', parseError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'analyse du contrat. Réessayez.' },
        { status: 500 }
      )
    }

    // Validation basique du résultat
    if (typeof analysis.globalScore !== 'number' || !Array.isArray(analysis.clauses)) {
      return NextResponse.json(
        { error: 'Format d\'analyse invalide. Réessayez.' },
        { status: 500 }
      )
    }

    // Sauvegarder en DB si l'utilisateur est connecté
    let analysisId: string | null = null
    
    if (user) {
      // Insérer l'analyse
      const { data: analysisData, error: analysisError } = await supabase
        .from('analyses')
        .insert({
          user_id: user.id,
          filename: filename || 'contrat.pdf',
          file_type: fileType || 'pdf',
          global_score: analysis.globalScore,
          summary: analysis.summary,
          red_flags: analysis.redFlags,
          positive_points: analysis.positivePoints,
        })
        .select('id')
        .single()

      if (analysisError) {
        console.error('Erreur sauvegarde analyse:', analysisError)
      } else {
        analysisId = analysisData.id

        // Insérer les clauses
        const clausesData = analysis.clauses.map((clause) => ({
          analysis_id: analysisId,
          name: clause.type,
          status: clause.riskLevel,
          short_description: clause.found ? 'Clause trouvée' : 'Clause absente',
          original_text: clause.originalText,
          explanation: clause.explanation,
          recommendation: clause.recommendation,
          suggested_rewrite: clause.suggestedRewrite,
        }))

        const { error: clausesError } = await supabase
          .from('clauses')
          .insert(clausesData)

        if (clausesError) {
          console.error('Erreur sauvegarde clauses:', clausesError)
        }

        // Incrémenter le compteur d'analyses de l'utilisateur
        await supabase.rpc('increment_analyses_count', { user_id: user.id })
      }
    }

    return NextResponse.json({
      success: true,
      analysisId,
      analysis,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    })

  } catch (error) {
    console.error('Erreur analyse:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('api_key')) {
        return NextResponse.json(
          { error: 'Configuration API invalide' },
          { status: 500 }
        )
      }
      if (error.message.includes('rate_limit')) {
        return NextResponse.json(
          { error: 'Trop de requêtes. Réessayez dans quelques secondes.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse. Réessayez.' },
      { status: 500 }
    )
  }
}