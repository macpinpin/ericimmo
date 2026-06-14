import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import type { Buyer, Property } from '@/lib/types'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const resend = new Resend(process.env.RESEND_API_KEY)

function computeScore(buyer: Buyer, property: Property): number {
  let score = 0

  // Budget 30% — BLOQUANT si renseigné
  if (buyer.budget_min === null && buyer.budget_max === null) {
    score += 30
  } else {
    const inRange =
      (buyer.budget_min === null || property.price >= buyer.budget_min) &&
      (buyer.budget_max === null || property.price <= buyer.budget_max)
    if (inRange) score += 30
    else if (buyer.budget_max && property.price <= buyer.budget_max * 1.15) score += 15
    else return 0 // trop loin du budget → pas de match
  }

  // Type 20% — BLOQUANT si renseigné
  if (!buyer.property_type) {
    score += 20
  } else if (buyer.property_type === property.type) {
    score += 20
  } else {
    return 0 // mauvais type → pas de match
  }

  // Location 25%
  if (!buyer.district) {
    score += 25
  } else if (buyer.district === property.district) {
    score += 10
    if (!buyer.concelho) {
      score += 15
    } else if (buyer.concelho === property.concelho) {
      score += 10
      if (!buyer.freguesia || buyer.freguesia === property.freguesia) score += 5
    }
  }

  // Bedrooms 15%
  if (!buyer.bedrooms_min || (property.bedrooms ?? 0) >= buyer.bedrooms_min) score += 15

  // Area 10%
  const propArea = property.area_bruta_privativa || property.area_utile
  if (!buyer.area_min && !buyer.area_max) {
    score += 10
  } else if (propArea) {
    const inArea =
      (buyer.area_min === null || propArea >= buyer.area_min) &&
      (buyer.area_max === null || propArea <= buyer.area_max)
    if (inArea) score += 10
  }

  return score
}

export async function runMatching(debug = false) {
  // 1. Fetch all data in parallel
  const [{ data: buyers }, { data: properties }] = await Promise.all([
    supabase.from('buyers').select('*'),
    supabase.from('properties').select('*').eq('status', 'active'),
  ])

  if (!buyers?.length || !properties?.length) return { matched: 0, buyers: buyers?.length ?? 0, properties: properties?.length ?? 0 }

  // Réinitialiser les matchs existants à chaque run
  await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  if (debug) {
    const scores = (buyers as Buyer[]).flatMap(buyer =>
      (properties as Property[]).map(property => ({
        buyer: buyer.name,
        property: property.title,
        status: property.status,
        score: computeScore(buyer, property),
      }))
    )
    return { debug: scores }
  }

  // 2. Compute all matches
  const newMatchRows: Array<{ buyer: Buyer; property: Property; score: number }> = []

  for (const buyer of buyers as Buyer[]) {
    for (const property of properties as Property[]) {
      const score = computeScore(buyer, property)
      if (score < 60) continue
      newMatchRows.push({ buyer, property, score })
    }
  }

  if (!newMatchRows.length) return { matched: 0 }

  // 3. Check which are already notified (batch query)
  const { data: existingMatches } = await supabase
    .from('matches')
    .select('id, buyer_id, property_id, notified_at')
    .in('buyer_id', newMatchRows.map(r => r.buyer.id))
    .in('property_id', newMatchRows.map(r => r.property.id))

  const alreadyNotified = new Set(
    (existingMatches || [])
      .filter(m => m.notified_at)
      .map(m => `${m.buyer_id}:${m.property_id}`)
  )
  const existingMap = new Map(
    (existingMatches || []).map(m => [`${m.buyer_id}:${m.property_id}`, m.id])
  )

  const toProcess = newMatchRows.filter(r => !alreadyNotified.has(`${r.buyer.id}:${r.property.id}`))
  if (!toProcess.length) return { matched: 0 }

  // 4. Upsert matches in DB (fast, no email yet)
  const now = new Date().toISOString()
  for (const { buyer, property, score } of toProcess) {
    const key = `${buyer.id}:${property.id}`
    const payload = {
      buyer_id: buyer.id,
      property_id: property.id,
      buyer_agent_id: buyer.agent_id,
      seller_agent_id: property.agent_id,
      score,
      status: 'new',
      notified_at: now,
    }
    const existingId = existingMap.get(key)
    if (existingId) {
      await supabase.from('matches').update(payload).eq('id', existingId)
    } else {
      await supabase.from('matches').insert(payload)
    }
  }

  // 5. Send emails in background (non-blocking)
  sendEmails(toProcess).catch(console.error)

  return { matched: toProcess.length }
}

async function sendEmails(matches: Array<{ buyer: Buyer; property: Property; score: number }>) {
  // Batch fetch all unique agent emails
  const agentIds = [...new Set(matches.flatMap(m => [m.buyer.agent_id, m.property.agent_id]))]
  const emailMap = new Map<string, string>()
  await Promise.all(
    agentIds.map(async id => {
      const { data } = await supabase.auth.admin.getUserById(id)
      if (data?.user?.email) emailMap.set(id, data.user.email)
    })
  )

  for (const { buyer, property, score } of matches) {
    const buyerAgentEmail = emailMap.get(buyer.agent_id)
    const sellerAgentEmail = emailMap.get(property.agent_id)
    const priceFormatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.price)
    const scoreBar = '█'.repeat(Math.round(score / 10)) + '░'.repeat(10 - Math.round(score / 10))

    if (buyerAgentEmail) {
      await resend.emails.send({
        from: 'Habiteo Matching <onboarding@resend.dev>',
        to: buyerAgentEmail,
        subject: `🔔 Match ${score}% — ${buyer.name} ↔ ${property.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#f97316;padding:24px;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:22px">🔔 Nouveau match Habiteo</h1>
            </div>
            <div style="background:white;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
              <p style="font-size:32px;font-weight:bold;color:#f97316;margin:0 0 4px">${score}%</p>
              <p style="font-family:monospace;color:#999;font-size:13px;margin:0 0 24px">${scoreBar}</p>
              <h2 style="margin:0 0 8px;font-size:18px">Votre acheteur : ${buyer.name}</h2>
              <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
                <tr><td style="padding:6px 0;color:#666">Budget</td><td>${buyer.budget_max ? new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(buyer.budget_max)+' max' : '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Type</td><td>${buyer.property_type || '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Localisation</td><td>${[buyer.district, buyer.concelho].filter(Boolean).join(' › ') || '—'}</td></tr>
              </table>
              <h2 style="margin:0 0 8px;font-size:18px">Bien : ${property.title}</h2>
              <table style="width:100%;border-collapse:collapse;font-size:14px">
                <tr><td style="padding:6px 0;color:#666">Prix</td><td style="font-weight:bold">${priceFormatted}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Localisation</td><td>${[property.district, property.concelho].filter(Boolean).join(' › ') || property.location}</td></tr>
                ${property.is_offmarket ? '<tr><td style="padding:6px 0;color:#666">Statut</td><td>🔒 Off-market</td></tr>' : ''}
              </table>
            </div>
          </div>`,
      }).catch(console.error)
    }

    if (property.is_offmarket && sellerAgentEmail && sellerAgentEmail !== buyerAgentEmail) {
      await resend.emails.send({
        from: 'Habiteo Matching <onboarding@resend.dev>',
        to: sellerAgentEmail,
        subject: `🔔 Match ${score}% — Intérêt pour votre bien off-market ${property.ref || property.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#f97316;padding:24px;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:22px">🔔 Intérêt pour votre bien off-market</h1>
            </div>
            <div style="background:white;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
              <p style="font-size:32px;font-weight:bold;color:#f97316;margin:0 0 4px">${score}%</p>
              <p style="font-family:monospace;color:#999;font-size:13px;margin:0 0 24px">${scoreBar}</p>
              <h2 style="margin:0 0 8px;font-size:18px">Votre bien : ${property.title}</h2>
              <p style="font-size:14px;color:#444">Un confrère Habiteo a un acheteur à <strong>${score}%</strong> de compatibilité. Connectez-vous au dashboard pour voir les détails.</p>
            </div>
          </div>`,
      }).catch(console.error)
    }
  }
}
