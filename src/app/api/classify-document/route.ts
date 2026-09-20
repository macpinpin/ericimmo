import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { extractText, getDocumentProxy } from 'unpdf'
import type { PropertyDocumentType } from '@/lib/types'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Documents administratifs portugais standardisés — en-têtes reconnaissables
// à l'échelle nationale, indépendamment de la conservatória/câmara émettrice.
const SIGNATURES: { type: PropertyDocumentType; patterns: RegExp[] }[] = [
  { type: 'caderneta_predial', patterns: [/caderneta predial/i, /matriz predial/i] },
  { type: 'certificado_energetico', patterns: [/certificado (sce|energ[eé]tico)/i, /\bADENE\b/i, /classe energ[eé]tica/i] },
  { type: 'certidao_registo_predial', patterns: [/certid[aã]o (predial|permanente)/i, /conservat[oó]ria do registo predial/i] },
  { type: 'licenca_utilizacao', patterns: [/licen[cç]a de utiliza[cç][aã]o/i, /licen[cç]a de habita[cç][aã]o/i, /alvar[aá] de (licen[cç]a|utiliza[cç][aã]o)/i, /c[aâ]mara municipal/i] },
]

function classifyFromText(text: string): PropertyDocumentType | null {
  for (const { type, patterns } of SIGNATURES) {
    if (patterns.some(p => p.test(text))) return type
  }
  return null
}

async function classifyFromImage(buffer: Buffer, mediaType: string): Promise<PropertyDocumentType | null> {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 20,
    system: 'You are a classifier. Reply with exactly one word, nothing else.',
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp', data: buffer.toString('base64') } },
        { type: 'text', text: 'Ce document officiel portugais est-il une "Caderneta Predial Urbana", un "Certificado Energético" (ADENE/SCE), une "Certidão de Registo Predial" (conservatória), ou une "Licença de Utilização/Habitação" (câmara municipal) ? Réponds avec exactement un mot parmi : caderneta, energetico, certidao, licenca, autre.' },
      ],
    }],
  })
  const content = message.content[0]
  if (content.type !== 'text') return null
  const word = content.text.trim().toLowerCase()
  if (word.includes('caderneta')) return 'caderneta_predial'
  if (word.includes('energ')) return 'certificado_energetico'
  if (word.includes('certidao') || word.includes('certidão')) return 'certidao_registo_predial'
  if (word.includes('licenca') || word.includes('licença')) return 'licenca_utilizacao'
  return null
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof Blob)) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const contentType = file.type || ''

    let docType: PropertyDocumentType | null = null

    if (contentType === 'application/pdf') {
      const doc = await getDocumentProxy(new Uint8Array(buffer))
      const { text } = await extractText(doc, { mergePages: true })
      docType = classifyFromText(text)
      // Repli sur l'analyse visuelle si le texte n'a rien donné (PDF scanné, sans texte)
      if (!docType && buffer.length < 5_000_000) {
        // unpdf ne rend pas d'image ici : on ne tente la vision que pour de vraies images.
      }
    } else if (contentType.startsWith('image/')) {
      docType = await classifyFromImage(buffer, contentType)
    }

    return NextResponse.json({ docType: docType || 'outro' })
  } catch (err) {
    console.error('Classify document error:', err)
    return NextResponse.json({ docType: 'outro' })
  }
}
