import { NextRequest, NextResponse } from 'next/server'
import { extractText, truncateText, getFileType } from '@/lib/extract'

const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 })
    }

    const fileType = getFileType(file.name)
    if (fileType === 'unknown') {
      return NextResponse.json({ error: 'Format non supporté. Utilisez PDF ou DOCX.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux. Maximum 5MB.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const rawText = await extractText(buffer, file.name)
    const text = truncateText(rawText)

    if (!text || text.trim().length < 100) {
      return NextResponse.json({ error: 'Le document semble vide ou trop court.' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      filename: file.name,
      fileType,
      textLength: text.length,
      text,
    })
  } catch (error) {
    console.error('Erreur upload:', error)
    return NextResponse.json({ error: 'Erreur lors du traitement du fichier.' }, { status: 500 })
  }
}