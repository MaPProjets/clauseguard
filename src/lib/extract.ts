import mammoth from 'mammoth'
import { extractText as extractPdfText } from 'unpdf'

export type FileType = 'pdf' | 'docx' | 'unknown'

export function getFileType(filename: string): FileType {
  const ext = filename.toLowerCase().split('.').pop()
  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx' || ext === 'doc') return 'docx'
  return 'unknown'
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const result = await extractPdfText(new Uint8Array(buffer))
    // unpdf retourne { text: string, totalPages: number } ou { text: string[] }
    let text: string
    if (typeof result.text === 'string') {
      text = result.text
    } else if (Array.isArray(result.text)) {
      text = result.text.join('\n')
    } else {
      text = String(result.text || '')
    }
    return text.trim()
  } catch (error) {
    console.error('Erreur extraction PDF:', error)
    throw new Error('Impossible d\'extraire le texte du PDF')
  }
}

export async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  } catch (error) {
    console.error('Erreur extraction DOCX:', error)
    throw new Error('Impossible d\'extraire le texte du DOCX')
  }
}

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const fileType = getFileType(filename)
  
  switch (fileType) {
    case 'pdf':
      return extractTextFromPDF(buffer)
    case 'docx':
      return extractTextFromDOCX(buffer)
    default:
      throw new Error('Format de fichier non supporté. Utilisez PDF ou DOCX.')
  }
}

export const MAX_TEXT_LENGTH = 50000

export function truncateText(text: string): string {
  if (text.length <= MAX_TEXT_LENGTH) return text
  return text.slice(0, MAX_TEXT_LENGTH) + '\n\n[... Document tronqué pour l\'analyse ...]'
}