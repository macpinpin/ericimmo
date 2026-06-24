export const dynamic = 'force-dynamic'
import { runMatching } from '../engine'

export const maxDuration = 30

export async function POST() {
  try {
    const result = await runMatching()
    return Response.json(result)
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
