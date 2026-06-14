import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const GROUPS: Array<{ [key: string]: string }> = [
  { pt: 'Portuguese', en: 'English', de: 'German' },
  { nl: 'Dutch', zh: 'Mandarin Chinese' },
]

async function translateGroup(
  title: string,
  text: string,
  group: { [key: string]: string }
): Promise<{ title: Record<string, string>; description: Record<string, string> }> {
  const codes = Object.keys(group)
  const langs = Object.entries(group).map(([code, name]) => `"${code}" = ${name}`).join(', ')

  const prompt = `You are a luxury real estate expert. Translate this French listing into these languages: ${langs}.

FRENCH TITLE: ${title}
FRENCH DESCRIPTION: ${text}

Return ONLY valid JSON, no markdown, no explanation:
{"title":{${codes.map(c => `"${c}":""`).join(',')}},"description":{${codes.map(c => `"${c}":""`).join(',')}}}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 3000,
    system: 'You are a JSON API. Output only valid JSON.',
    messages: [{ role: 'user', content: prompt }],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Invalid response')

  const raw = content.text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

  try {
    return JSON.parse(raw)
  } catch {
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON found')
    return JSON.parse(match[0])
  }
}

export async function POST(req: Request) {
  const { text, title } = await req.json()
  if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 })

  try {
    const results = await Promise.all(GROUPS.map(g => translateGroup(title || text, text, g)))

    const translations = {
      title: Object.assign({}, ...results.map(r => r.title)),
      description: Object.assign({}, ...results.map(r => r.description)),
    }

    return NextResponse.json({ translations })
  } catch (err: any) {
    console.error('Translation error:', err)
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
