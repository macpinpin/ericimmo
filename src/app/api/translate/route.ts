import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

export const runtime = 'edge'
export const maxDuration = 30

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

  const prompt = `You are a luxury real estate expert and professional translator. Translate this French property listing into 9 languages.

FRENCH TITLE: ${title}
FRENCH DESCRIPTION: ${text}

Return a single valid JSON object with exactly this structure (no markdown, no explanation, just the JSON):
{"title":{"pt":"...","en":"...","es":"...","de":"...","zh":"...","it":"...","nl":"...","ru":"...","ar":"..."},"description":{"pt":"...","en":"...","es":"...","de":"...","zh":"...","it":"...","nl":"...","ru":"...","ar":"..."}}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: 'You are a JSON API. You only output valid JSON, never markdown, never explanations.',
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') return NextResponse.json({ error: 'Invalid response' }, { status: 500 })

    const raw = content.text.trim()
    // Retire les balises markdown si présentes
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

    let translations
    try {
      translations = JSON.parse(cleaned)
    } catch {
      // Tentative d'extraction du JSON
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) return NextResponse.json({ error: 'No JSON found', raw: raw.slice(0, 500) }, { status: 500 })
      translations = JSON.parse(match[0])
    }

    return NextResponse.json({ translations })
  } catch (err: any) {
    console.error('Translation error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
