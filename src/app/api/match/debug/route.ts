import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return Response.json({ error: 'Missing env vars', url: !!url, key: !!key })
  }

  const supabase = createClient(url, key)
  const { data: buyers, error: e1 } = await supabase.from('buyers').select('id, name')
  const { data: props, error: e2 } = await supabase.from('properties').select('id, title, status')

  return Response.json({
    buyers: buyers?.length ?? 0,
    buyersError: e1?.message,
    properties: props?.length ?? 0,
    propertiesError: e2?.message,
    buyersSample: buyers?.slice(0, 2),
    propsSample: props?.slice(0, 2),
  })
}
