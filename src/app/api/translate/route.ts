import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const LANGUAGES = {
  pt: 'portugais',
  en: 'anglais',
  es: 'espagnol',
  de: 'allemand',
  zh: 'chinois mandarin',
  it: 'italien',
  nl: 'néerlandais',
  ru: 'russe',
  ar: 'arabe',
}

export async function POST(req: Request) {
  const { text, title } = await req.json()
  if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 })

  const prompt = `Tu es un expert en immobilier de luxe. Traduis cette annonce immobilière du français vers les langues suivantes. Garde le style professionnel et adapté au marché immobilier local. Retourne UNIQUEMENT un objet JSON valide.

Annonce à traduire :
Titre : ${title}
Description : ${text}

Langues cibles : ${Object.entries(LANGUAGES).map(([code, lang]) => `"${code}" (${lang})`).join(', ')}

Réponds UNIQUEMENT avec ce JSON, sans texte avant ou après :
{
  "title": {"pt":"...","en":"...","es":"...","de":"...","zh":"...","it":"...","nl":"...","ru":"...","ar":"..."},
  "description": {"pt":"...","en":"...","es":"...","de":"...","zh":"...","it":"...","nl":"...","ru":"...","ar":"..."}
}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') return NextResponse.json({ error: 'Invalid response' }, { status: 500 })

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'No JSON found', raw: content.text }, { status: 500 })

    const translations = JSON.parse(jsonMatch[0])
    return NextResponse.json({ translations })
  } catch (err: any) {
    console.error('Translation error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
