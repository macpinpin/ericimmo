import { NextResponse } from 'next/server'
import { generateCmiPdf } from '@/lib/cmi-pdf'
import type { Property, PropertyMandate } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { property, mandate, agentName } = (await req.json()) as {
      property: Property
      mandate: PropertyMandate
      agentName: string
    }
    if (!property || !mandate || !agentName) {
      return NextResponse.json({ error: 'property, mandate et agentName requis' }, { status: 400 })
    }

    const buffer = await generateCmiPdf(property, mandate, agentName)
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="CMI-${property.ref || property.id}.pdf"`,
      },
    })
  } catch (err) {
    console.error('Generate CMI error:', err)
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
