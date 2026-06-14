import { runMatching } from '../engine'

export async function GET() {
  const result = await runMatching(true)
  return Response.json(result)
}
