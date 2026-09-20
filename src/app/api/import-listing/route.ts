import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import dns from 'node:dns/promises'
import { isIP } from 'node:net'
import { getDistricts } from '@/lib/portugal'

export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const PROPERTY_TYPES = ['villa', 'apartment', 'land', 'commercial', 'other']

function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    const lower = ip.toLowerCase()
    if (lower === '::1') return true
    if (lower.startsWith('fe80:') || lower.startsWith('fc') || lower.startsWith('fd')) return true
    if (lower.startsWith('::ffff:')) {
      const v4 = lower.split(':').pop()!
      if (isIP(v4)) return isPrivateIp(v4)
    }
    return false
  }
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(n => Number.isNaN(n))) return true
  const [a, b] = parts
  if (a === 10 || a === 127 || a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  return false
}

async function assertPublicHost(hostnameRaw: string) {
  const hostname = hostnameRaw.replace(/^\[|\]$/g, '')
  if (/^(localhost)$/i.test(hostname)) throw new Error('URL non autorisée')
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error('URL non autorisée')
    return
  }
  const records = await dns.lookup(hostname, { all: true })
  for (const r of records) {
    if (isPrivateIp(r.address)) throw new Error('URL non autorisée')
  }
}

async function safeFetch(target: string, opts: { maxBytes: number; timeoutMs: number; accept?: string }) {
  let current = target
  for (let hop = 0; hop < 5; hop++) {
    const parsed = new URL(current)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('URL non autorisée')
    await assertPublicHost(parsed.hostname)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), opts.timeoutMs)
    let res: Response
    try {
      res = await fetch(current, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: opts.accept || '*/*',
          'Accept-Language': 'pt-PT,pt;q=0.9,fr;q=0.8,en;q=0.7',
        },
        redirect: 'manual',
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location')
      if (!location) throw new Error('Redirection invalide')
      current = new URL(location, current).href
      continue
    }
    if (res.status === 403 || res.status === 429 || res.status === 503) {
      throw new Error(`Ce site bloque les accès automatisés (erreur ${res.status}) — impossible d'importer depuis ce portail. Essayez un autre lien, ou remplissez le formulaire manuellement.`)
    }
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`)

    const reader = res.body?.getReader()
    const contentType = res.headers.get('content-type') || ''
    if (!reader) return { buffer: Buffer.alloc(0), contentType, finalUrl: current }
    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.length
      if (total > opts.maxBytes) { reader.cancel(); break }
      chunks.push(value)
    }
    return { buffer: Buffer.concat(chunks), contentType, finalUrl: current }
  }
  throw new Error('Trop de redirections')
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${property}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return m[1]
  }
  return null
}

function extractImages(html: string, baseUrl: string): string[] {
  const urls = new Set<string>()
  const imgRe = /<img[^>]+(?:data-src|data-lazy|src)=["']([^"'\s]+)["']/gi
  let m
  while ((m = imgRe.exec(html)) && urls.size < 60) {
    try { urls.add(new URL(m[1], baseUrl).href) } catch { /* ignore invalid src */ }
  }
  const ogImage = extractMeta(html, 'og:image')
  if (ogImage) {
    try { urls.add(new URL(ogImage, baseUrl).href) } catch { /* ignore invalid src */ }
  }
  return [...urls].filter(u => /^https?:\/\//i.test(u) && !/\.(svg|gif)(\?|$)/i.test(u))
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractJsonLd(html: string): string {
  const blocks: string[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m
  while ((m = re.exec(html)) && blocks.length < 3) {
    blocks.push(m[1].trim().slice(0, 2000))
  }
  return blocks.join('\n---\n')
}

export async function POST(req: Request) {
  try {
    const { url, agentId } = await req.json()
    if (!url || !agentId) return NextResponse.json({ error: 'URL et agentId requis' }, { status: 400 })

    let parsed: URL
    try { parsed = new URL(url) } catch { return NextResponse.json({ error: 'URL invalide' }, { status: 400 }) }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'URL invalide' }, { status: 400 })
    }

    const page = await safeFetch(url, { maxBytes: 4_000_000, timeoutMs: 15000, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' })
    const html = page.buffer.toString('utf-8')

    const title = extractMeta(html, 'og:title') || (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '')
    const description = extractMeta(html, 'og:description') || extractMeta(html, 'description') || ''
    const jsonLd = extractJsonLd(html)
    const bodyText = stripTags(html).slice(0, 5000)
    const imageCandidates = extractImages(html, page.finalUrl)
    const districts = getDistricts()

    const prompt = `Tu es un assistant qui extrait les informations d'une annonce immobilière à partir du contenu brut d'une page web (portail immobilier). Réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaire.

Districts valides (Portugal) — utilise EXACTEMENT une de ces valeurs si tu peux la déterminer, sinon null :
${districts.join(', ')}

Types valides : villa, apartment, land, commercial, other

Contenu de la page :
TITRE META: ${title}
DESCRIPTION META: ${description}
DONNÉES STRUCTURÉES (JSON-LD, peut être vide) :
${jsonLd || '(aucune)'}
TEXTE DE LA PAGE :
${bodyText}

Retourne ce JSON exact (utilise null si une info est absente ou incertaine — n'invente rien) :
{"title":"","description":"","price":0,"type":"villa","location":"","district":null,"bedrooms":null,"bathrooms":null,"area":null,"ref":null}

- "title": titre court et propre de l'annonce
- "description": 2 à 4 phrases en français, factuelles, résumant le bien (ne pas inventer de détails absents du texte)
- "price": nombre uniquement, en euros, sans symbole ni séparateur (ex: 450000)
- "location": la localisation telle qu'affichée sur l'annonce (ville/région)
- "area": surface habitable en m², nombre uniquement
- "ref": référence de l'annonce si visible sur le portail`

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: 'You are a JSON API. Output only valid JSON, no markdown.',
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Réponse invalide')
    const raw = content.text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let extracted: any
    try { extracted = JSON.parse(raw) }
    catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Extraction impossible')
      extracted = JSON.parse(match[0])
    }

    const type = PROPERTY_TYPES.includes(extracted.type) ? extracted.type : 'other'
    const district = districts.includes(extracted.district) ? extracted.district : null
    const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

    // Photos re-téléchargées côté serveur puis stockées sur notre bucket (pas de dépendance au portail d'origine)
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const images: string[] = []
    for (const imgUrl of imageCandidates) {
      if (images.length >= 12) break
      try {
        const img = await safeFetch(imgUrl, { maxBytes: 8_000_000, timeoutMs: 8000, accept: 'image/avif,image/webp,image/*,*/*;q=0.8' })
        if (!img.contentType.startsWith('image/')) continue
        const ext = (img.contentType.split('/')[1]?.split(';')[0] || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 4) || 'jpg'
        const path = `${agentId}/import-${Date.now()}-${images.length}.${ext}`
        const { error } = await supabase.storage.from('property-images').upload(path, img.buffer, { contentType: img.contentType })
        if (error) continue
        const { data } = supabase.storage.from('property-images').getPublicUrl(path)
        images.push(data.publicUrl)
      } catch {
        continue
      }
    }

    return NextResponse.json({
      title: extracted.title || '',
      description: extracted.description || '',
      price: num(extracted.price),
      type,
      location: extracted.location || '',
      district,
      bedrooms: num(extracted.bedrooms),
      bathrooms: num(extracted.bathrooms),
      area: num(extracted.area),
      ref: extracted.ref || null,
      images,
    })
  } catch (err) {
    console.error('Import listing error:', err)
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
