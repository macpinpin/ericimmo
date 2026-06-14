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

  const langList = Object.keys(LANGUAGES).join('","')

  const prompt = `Tu es un expert en immobilier de luxe. Traduis cette annonce immobilière du français vers 9 langues. Style professionnel, adapté au marché local.

TITRE FR: ${title}
DESCRIPTION FR: ${text}

Réponds UNIQUEMENT avec du JSON valide, sans aucun texte avant ou après, sans balises markdown. Format exact :
{"title":{"pt":"","en":"","es":"","de":"","zh":"","it":"","nl":"","ru":"","ar":""},"description":{"pt":"","en":"","es":"","de":"","zh":"","it":"","nl":"","ru":"","ar":""}}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
        {
          role: 'assistant',
          content: '{"title":{',
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') return NextResponse.json({ error: 'Invalid response' }, { status: 500 })

    // Le modèle continue après '{"title":{'
    const raw = '{"title":{' + content.text
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return NextResponse.json({ error: 'No JSON found', raw: content.text.slice(0, 300) }, { status: 500 })

    const translations = JSON.parse(jsonMatch[0])
    return NextResponse.json({ translations })
  } catch (err: any) {
    console.error('Translation error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
