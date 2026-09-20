import { NextResponse } from 'next/server'
import { extractText, getDocumentProxy } from 'unpdf'
import { getDistricts, getConcelhos, getFreguesias } from '@/lib/portugal'

export const dynamic = 'force-dynamic'

// Correspondance entre "NATUREZA" (eGO) et notre enum de type de bien.
const NATUREZA_TYPE: Record<string, string> = {
  moradia: 'villa',
  apartamento: 'apartment',
  terreno: 'land',
  loja: 'commercial',
  escritório: 'commercial',
  escritorio: 'commercial',
  armazém: 'commercial',
  armazem: 'commercial',
}

// L'export PDF eGO est un gabarit fixe et toujours identique (impression de la fiche
// interne du bien) : on peut donc extraire les champs de façon déterministe par
// libellé, sans passer par une IA — bien plus fiable que le scraping d'un site public.
function grabAfterLabel(text: string, label: string): string | null {
  const re = new RegExp(`${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\n]*\\n+([^\\n]+)`, 'i')
  const m = text.match(re)
  if (!m) return null
  // les icônes d'interface (zone privée Unicode) se glissent parfois en tête/queue de valeur
  const cleaned = m[1].replace(/[-]/g, '').trim()
  return cleaned || null
}

function grabNumberAfterLabel(text: string, label: string): number | null {
  const v = grabAfterLabel(text, label)
  if (!v) return null
  const n = parseFloat(v.replace(/[^\d.,]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

// La page contient deux libellés "REFERÊNCIA" (la nôtre, ex: "SAFTI:008710", et la
// référence cadastrale, un simple numéro) — on prend la première qui ressemble à
// "AGENCE:code".
function extractRef(text: string): string | null {
  const re = /REFERÊNCIA\s*\n+\s*([^\n]+)/gi
  let m
  while ((m = re.exec(text))) {
    if (m[1].includes(':')) return m[1].trim()
  }
  return null
}

// L'impression navigateur d'un textarea défilant duplique parfois la dernière ligne
// visible à la coupure de page — on déduplique les lignes strictement identiques
// consécutives, et on nettoie les artefacts de pagination/interface du PDF.
function extractDescription(text: string): string | null {
  const start = text.indexOf('DESCRIÇÃO')
  const end = text.indexOf('Características', start)
  if (start === -1 || end === -1) return null
  const block = text.slice(start + 'DESCRIÇÃO'.length, end)
  const lines = block.split('\n').map(l => l.trim())
  const kept: string[] = []
  for (const line of lines) {
    if (!line) continue
    if (/^--\s*\d+\s*of\s*\d+\s*--$/.test(line)) continue
    if (/^\d+\s*\/\s*\d+$/.test(line)) continue
    if (/LIMITE DE CARACTERES/i.test(line)) continue
    if (/^Franc[êe]s/i.test(line)) continue
    if (/^[-\s]+$/.test(line)) continue // glyphes d'icônes de l'interface (zone privée Unicode)
    if (kept.length && kept[kept.length - 1] === line) continue
    kept.push(line)
  }
  return kept.join(' ').replace(/\s+/g, ' ').trim() || null
}

// Plusieurs freguesias ont fusionné lors de la réforme administrative de 2013
// ("Algoz" -> "Algoz e Tunes"), mais un CRM comme eGO utilise parfois encore
// l'ancien nom seul — on cherche une correspondance partielle avant d'abandonner.
function matchInList(raw: string | null, options: string[]): string | null {
  if (!raw) return null
  const exact = options.find(o => o === raw)
  if (exact) return exact
  const rawLower = raw.trim().toLowerCase()
  const partial = options.find(o => o.toLowerCase().split(/\s+e\s+/).includes(rawLower))
  return partial || null
}

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!(file instanceof Blob)) return NextResponse.json({ error: 'Fichier PDF requis' }, { status: 400 })
    if (file.type && file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Le fichier doit être un PDF' }, { status: 400 })
    }

    const buffer = new Uint8Array(await file.arrayBuffer())
    const doc = await getDocumentProxy(buffer)
    const { text } = await extractText(doc, { mergePages: true })

    const natureza = grabAfterLabel(text, 'NATUREZA')
    const type = natureza ? (NATUREZA_TYPE[natureza.trim().toLowerCase()] || 'other') : 'other'

    const districts = getDistricts()
    const distritoRaw = grabAfterLabel(text, 'DISTRITO')
    const concelhoRaw = grabAfterLabel(text, 'CONCELHO')
    const freguesiaRaw = grabAfterLabel(text, 'FREGUESIA')
    const district = distritoRaw && districts.includes(distritoRaw) ? distritoRaw : null
    const concelho = district ? matchInList(concelhoRaw, getConcelhos(district)) : null
    const freguesia = district && concelho ? matchInList(freguesiaRaw, getFreguesias(district, concelho)) : null

    const price = grabNumberAfterLabel(text, 'VALOR')
    const areaUtil = grabNumberAfterLabel(text, 'ÁREA ÚTIL')
    const areaBruta = grabNumberAfterLabel(text, 'ÁREA BRUTA')
    const areaTerreno = grabNumberAfterLabel(text, 'ÁREA TERRENO')
    const bedrooms = grabNumberAfterLabel(text, 'QUARTOS')
    const bathrooms = grabNumberAfterLabel(text, 'CASAS DE BANHO')
    const title = grabAfterLabel(text, 'TÍTULO')
    const description = extractDescription(text)
    const ref = extractRef(text)
    const location = [freguesia, concelho].filter(Boolean).join(', ') || null

    return NextResponse.json({
      title,
      description,
      price,
      type,
      location,
      district,
      concelho,
      freguesia,
      bedrooms,
      bathrooms,
      area: areaBruta ?? areaUtil,
      plot: areaTerreno,
      ref,
    })
  } catch (err) {
    console.error('Import PDF error:', err)
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
