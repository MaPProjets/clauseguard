import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { jsPDF } from 'jspdf'

function getScoreLabel(score: number): string {
  if (score > 70) return 'Contrat favorable'
  if (score > 40) return 'À négocier'
  return 'Contrat à risque'
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'critique': return 'CRITIQUE'
    case 'attention': return 'ATTENTION'
    case 'ok': return 'OK'
    case 'absent': return 'ABSENT'
    default: return status.toUpperCase()
  }
}

function getStatusColor(status: string): [number, number, number] {
  switch (status) {
    case 'critique': return [220, 38, 38]
    case 'attention': return [234, 138, 0]
    case 'ok': return [34, 160, 84]
    case 'absent': return [156, 163, 175]
    default: return [156, 163, 175]
  }
}

function getScoreColor(score: number): [number, number, number] {
  if (score > 70) return [34, 160, 84]
  if (score > 40) return [234, 138, 0]
  return [220, 38, 38]
}

// Helper : wrap long text into lines that fit within maxWidth
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth)
}

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
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer l'analyse
    const { data: analysis, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (analysisError || !analysis) {
      return NextResponse.json({ error: 'Analyse non trouvée' }, { status: 404 })
    }

    // Récupérer les clauses
    const { data: clauses } = await supabase
      .from('clauses')
      .select('*')
      .eq('analysis_id', id)

    // ── Générer le PDF ──
    const doc = new jsPDF('p', 'mm', 'a4')
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const contentWidth = pageWidth - margin * 2
    let y = margin

    // Helper : vérifier si on a besoin d'une nouvelle page
    const checkNewPage = (needed: number) => {
      if (y + needed > pageHeight - 25) {
        doc.addPage()
        y = margin
        addFooter()
      }
    }

    // Footer
    const addFooter = () => {
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text(
        `ClauseGuard — Rapport généré le ${new Date().toLocaleDateString('fr-FR')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
      doc.text(
        `Page ${doc.getNumberOfPages()}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      )
    }

    // ═══════════════════════════════════════
    // HEADER
    // ═══════════════════════════════════════
    doc.setFillColor(15, 23, 42) // slate-900
    doc.rect(0, 0, pageWidth, 45, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.text('ClauseGuard', margin, 20)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Rapport d\'analyse de contrat', margin, 28)

    doc.setFontSize(9)
    doc.setTextColor(200, 200, 200)
    const dateStr = new Date(analysis.created_at).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    doc.text(dateStr, pageWidth - margin, 20, { align: 'right' })
    doc.text(analysis.filename, pageWidth - margin, 28, { align: 'right' })

    y = 55

    // ═══════════════════════════════════════
    // SCORE
    // ═══════════════════════════════════════
    const scoreColor = getScoreColor(analysis.global_score)

    // Score box
    doc.setFillColor(248, 250, 252) // gray-50
    doc.roundedRect(margin, y, contentWidth, 35, 4, 4, 'F')

    // Score circle
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2])
    doc.circle(margin + 20, y + 17.5, 12, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(String(analysis.global_score), margin + 20, y + 17.5 + 1, { align: 'center', baseline: 'middle' })

    // Score label
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2])
    doc.setFontSize(16)
    doc.text(getScoreLabel(analysis.global_score), margin + 40, y + 14)

    doc.setTextColor(100, 116, 139)
    doc.setFontSize(9)
    doc.text('Score de confiance du contrat sur 100', margin + 40, y + 22)

    y += 45

    // ═══════════════════════════════════════
    // RÉSUMÉ
    // ═══════════════════════════════════════
    doc.setTextColor(15, 23, 42)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Résumé', margin, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(51, 65, 85)
    const summaryLines = wrapText(doc, analysis.summary, contentWidth)
    for (const line of summaryLines) {
      checkNewPage(6)
      doc.text(line, margin, y)
      y += 5
    }
    y += 8

    // ═══════════════════════════════════════
    // POINTS CRITIQUES (Red Flags)
    // ═══════════════════════════════════════
    if (analysis.red_flags && analysis.red_flags.length > 0) {
      checkNewPage(20)

      doc.setFillColor(254, 242, 242) // red-50
      doc.setDrawColor(220, 38, 38)
      doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'FD')
      doc.setTextColor(220, 38, 38)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('• Points critiques à négocier', margin + 4, y + 5.5)
      y += 12

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(51, 65, 85)

      for (const flag of analysis.red_flags) {
        const flagLines = wrapText(doc, `• ${flag}`, contentWidth - 4)
        for (let i = 0; i < flagLines.length; i++) {
          checkNewPage(5)
          doc.text(flagLines[i], margin + 4, y)
          y += 4.5
        }
        y += 1
      }
      y += 6
    }

    // ═══════════════════════════════════════
    // POINTS POSITIFS
    // ═══════════════════════════════════════
    if (analysis.positive_points && analysis.positive_points.length > 0) {
      checkNewPage(20)

      doc.setFillColor(240, 253, 244) // green-50
      doc.setDrawColor(34, 160, 84)
      doc.roundedRect(margin, y, contentWidth, 8, 2, 2, 'FD')
      doc.setTextColor(34, 160, 84)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('• Points positifs', margin + 4, y + 5.5)
      y += 12

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(51, 65, 85)

      for (const point of analysis.positive_points) {
        const pointLines = wrapText(doc, `• ${point}`, contentWidth - 4)
        for (let i = 0; i < pointLines.length; i++) {
          checkNewPage(5)
          doc.text(pointLines[i], margin + 4, y)
          y += 4.5
        }
        y += 1
      }
      y += 6
    }

    // ═══════════════════════════════════════
    // ANALYSE DÉTAILLÉE DES CLAUSES
    // ═══════════════════════════════════════
    if (clauses && clauses.length > 0) {
      checkNewPage(15)

      doc.setTextColor(15, 23, 42)
      doc.setFontSize(13)
      doc.setFont('helvetica', 'bold')
      doc.text(`Analyse détaillée des clauses (${clauses.length})`, margin, y)
      y += 10

      for (const clause of clauses) {
        // Estimer la hauteur nécessaire
        checkNewPage(40)

        const statusColor = getStatusColor(clause.status)

        // Clause header bar
        doc.setFillColor(248, 250, 252)
        doc.roundedRect(margin, y, contentWidth, 9, 2, 2, 'F')

        // Status badge
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
        const statusText = getStatusLabel(clause.status)
        const badgeWidth = doc.getTextWidth(statusText) * 0.7 + 6
        doc.roundedRect(margin + 3, y + 1.5, badgeWidth, 6, 1.5, 1.5, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.text(statusText, margin + 3 + badgeWidth / 2, y + 5.5, { align: 'center' })

        // Clause name
        doc.setTextColor(15, 23, 42)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text(clause.name, margin + badgeWidth + 8, y + 6)
        y += 13

        // Texte original
        if (clause.original_text) {
          checkNewPage(15)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(100, 116, 139)
          doc.text('Texte original :', margin + 4, y)
          y += 4

          doc.setFont('helvetica', 'italic')
          doc.setFontSize(8.5)
          doc.setTextColor(71, 85, 105)
          const originalLines = wrapText(doc, `"${clause.original_text}"`, contentWidth - 8)
          for (const line of originalLines) {
            checkNewPage(4.5)
            doc.text(line, margin + 4, y)
            y += 4
          }
          y += 2
        }

        // Explication
        if (clause.explanation) {
          checkNewPage(10)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(100, 116, 139)
          doc.text('Explication :', margin + 4, y)
          y += 4

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(51, 65, 85)
          const explLines = wrapText(doc, clause.explanation, contentWidth - 8)
          for (const line of explLines) {
            checkNewPage(4.5)
            doc.text(line, margin + 4, y)
            y += 4.5
          }
          y += 2
        }

        // Recommandation
        if (clause.recommendation) {
          checkNewPage(10)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(100, 116, 139)
          doc.text('Recommandation :', margin + 4, y)
          y += 4

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(51, 65, 85)
          const recoLines = wrapText(doc, clause.recommendation, contentWidth - 8)
          for (const line of recoLines) {
            checkNewPage(4.5)
            doc.text(line, margin + 4, y)
            y += 4.5
          }
          y += 2
        }

        // Reformulation suggérée
        if (clause.suggested_rewrite) {
          checkNewPage(10)
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(34, 160, 84)
          doc.text('Reformulation suggérée :', margin + 4, y)
          y += 4

          doc.setFillColor(240, 253, 244)
          const rewriteLines = wrapText(doc, clause.suggested_rewrite, contentWidth - 12)
          const rewriteHeight = rewriteLines.length * 4.5 + 4
          doc.roundedRect(margin + 4, y - 2, contentWidth - 8, rewriteHeight, 2, 2, 'F')

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(21, 128, 61)
          for (const line of rewriteLines) {
            checkNewPage(4.5)
            doc.text(line, margin + 8, y + 1)
            y += 4.5
          }
          y += 4
        }

        // Separator
        y += 3
        doc.setDrawColor(226, 232, 240)
        doc.line(margin, y, pageWidth - margin, y)
        y += 6
      }
    }

    // Add footer to all pages
    const totalPages = doc.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text(
        `ClauseGuard — Rapport généré le ${new Date().toLocaleDateString('fr-FR')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
      doc.text(
        `Page ${i} / ${totalPages}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: 'right' }
      )
    }

    // Output
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const safeName = analysis.filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ClauseGuard_${safeName}.pdf"`,
      },
    })

  } catch (error) {
    console.error('Erreur export PDF:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}
