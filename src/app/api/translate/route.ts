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

  const prompt = `Tu es un expert en immobilier de luxe. Traduis cette annonce immobilière du français vers les langues suivantes. Garde le style professionnel et adapté au marché immobilier local. Retourne UNIQUEMENT un objet JSON valide avec les codes de langue comme clés.

Annonce à traduire :
Titre : ${title}
Description : ${text}

Langues cibles et codes JSON :
${Object.entries(LANGUAGES).map(([code, lang]) => `- "${code}": traduction en ${lang}`).join('\n')}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après. Format :
{"pt":"...","en":"...","es":"...","de":"...","zh":"...","it":"...","nl":"...","ru":"...","ar":"..."}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') return NextResponse.json({ error: 'Invalid response' }, { status: 500 })

    // Extrait le JSON même s'il y a du texte autour
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'No JSON found', raw: content.text }, { status: 500 })

    const translations = JSON.parse(jsonMatch[0])
    return NextResponse.json({ translations })
  } catch (err: any) {
    console.error('Translation error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
