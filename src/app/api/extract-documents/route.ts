import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { EXTRACTION_PROMPT, EXTRACTION_SCHEMA, DOC_TYPES, type Extraction } from '@/lib/cmi-extraction'

// Lecture des documents d'un dossier (CMI) par Claude.
// Les fichiers restent dans le bucket privé « property-documents » : la route
// les lit avec le jeton de l'agent connecté, donc uniquement les siens (RLS).

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
type ImageType = typeof IMAGE_TYPES[number]
const MAX_TOTAL_BYTES = 24 * 1024 * 1024 // la requête vers Claude est limitée à 32 Mo (base64 compris)

export async function POST(req: Request) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Non connecté' }, { status: 401 })

  const { mandateId } = await req.json().catch(() => ({}))
  if (!mandateId) return NextResponse.json({ error: 'Dossier manquant' }, { status: 400 })

  const { data: docs, error } = await supabase
    .from('property_documents')
    .select('id, file_name, file_url, mime_type, size_bytes')
    .eq('mandate_id', mandateId)
    .eq('agent_id', user.id)
    .order('uploaded_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!docs?.length) return NextResponse.json({ error: 'Aucun document dans ce dossier' }, { status: 400 })

  const total = docs.reduce((n, d) => n + (d.size_bytes || 0), 0)
  if (total > MAX_TOTAL_BYTES) {
    return NextResponse.json({ error: `Documents trop lourds (${Math.round(total / 1024 / 1024)} Mo, maximum 24 Mo au total). Retirez ou compressez les plus gros fichiers.` }, { status: 413 })
  }

  // Un bloc texte « Documento N : nom » puis le document lui-même
  const content: Anthropic.Beta.BetaContentBlockParam[] = []
  for (const [i, doc] of docs.entries()) {
    const { data: blob, error: dlError } = await supabase.storage.from('property-documents').download(doc.file_url)
    if (dlError || !blob) return NextResponse.json({ error: `Impossible de lire « ${doc.file_name} »` }, { status: 500 })
    const data = Buffer.from(await blob.arrayBuffer()).toString('base64')
    const mime = doc.mime_type || blob.type
    content.push({ type: 'text', text: `Documento ${i + 1} : ${doc.file_name}` })
    if (mime === 'application/pdf') {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data } })
    } else if ((IMAGE_TYPES as readonly string[]).includes(mime)) {
      content.push({ type: 'image', source: { type: 'base64', media_type: mime as ImageType, data } })
    } else {
      content.push({ type: 'text', text: '(format non lisible – à ignorer)' })
    }
  }
  content.push({ type: 'text', text: EXTRACTION_PROMPT })

  let extraction: Extraction
  try {
    const message = await anthropic.beta.messages.stream({
      model: 'claude-opus-5-5',
      max_tokens: 32000,
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: EXTRACTION_SCHEMA } },
      messages: [{ role: 'user', content }],
    }).finalMessage()

    if (message.stop_reason === 'refusal') {
      return NextResponse.json({ error: 'La lecture automatique a été refusée pour ces documents. Remplissez le formulaire à la main.' }, { status: 422 })
    }
    if (message.stop_reason === 'max_tokens') {
      return NextResponse.json({ error: 'Réponse incomplète (trop de documents). Réessayez avec moins de documents.' }, { status: 422 })
    }
    const text = message.content.flatMap(b => (b.type === 'text' ? [b.text] : [])).join('')
    extraction = JSON.parse(text)
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return NextResponse.json({ error: 'Service de lecture saturé, réessayez dans une minute.' }, { status: 429 })
    if (e instanceof Anthropic.APIError) return NextResponse.json({ error: `Erreur du service de lecture (${e.status}) : ${e.message}` }, { status: 502 })
    return NextResponse.json({ error: 'Erreur de lecture : ' + (e instanceof Error ? e.message : 'inconnue') }, { status: 500 })
  }

  // Enregistre le type détecté de chaque document
  await Promise.all(extraction.documentos.map(d => {
    const doc = docs[d.indice - 1]
    if (!doc || !(d.tipo in DOC_TYPES)) return null
    return supabase.from('property_documents').update({ doc_type: d.tipo, extracted: { resumo: d.resumo } }).eq('id', doc.id)
  }))

  return NextResponse.json({ extraction, documents: docs.map(d => ({ id: d.id, file_name: d.file_name })) })
}
