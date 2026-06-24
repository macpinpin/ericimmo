import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import type { Buyer, Property } from '@/lib/types'

function getClients() {
  return {
    supabase: createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!),
    resend: new Resend(process.env.RESEND_API_KEY),
  }
}

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
  const { supabase, resend } = getClients()
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
  sendEmails(toProcess, supabase, resend).catch(console.error)

  return { matched: toProcess.length }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendEmails(matches: Array<{ buyer: Buyer; property: Property; score: number }>, supabase: any, resend: Resend) {
  // Fetch agent profiles (name + contact_email + phone + whatsapp)
  const agentIds = [...new Set(matches.flatMap(m => [m.buyer.agent_id, m.property.agent_id]))]
  type AgentProfile = { id: string; name: string; contact_email: string | null; email: string; phone: string | null; whatsapp: string | null }
  const { data: agentProfiles } = await supabase.from('agents').select('id,name,contact_email,email,phone,whatsapp').in('id', agentIds)
  const agentMap = new Map<string, AgentProfile>()
  for (const a of (agentProfiles || []) as AgentProfile[]) agentMap.set(a.id, a)

  for (const { buyer, property, score } of matches) {
    const buyerAgent = agentMap.get(buyer.agent_id)
    const sellerAgent = agentMap.get(property.agent_id)
    const isInterAgent = buyer.agent_id !== property.agent_id

    const buyerAgentEmail = buyerAgent?.contact_email || buyerAgent?.email
    const sellerAgentEmail = sellerAgent?.contact_email || sellerAgent?.email

    const priceFormatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.price)
    const scoreBar = '█'.repeat(Math.round(score / 10)) + '░'.repeat(10 - Math.round(score / 10))

    // Email à l'agent acheteur
    if (buyerAgentEmail) {
      const sellerContact = isInterAgent && sellerAgent ? `
        <div style="margin-top:24px;background:#f9fafb;border:1px solid #eee;border-radius:10px;padding:16px">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.05em">Agent propriétaire du bien</p>
          <p style="margin:0;font-weight:600;color:#111">${sellerAgent.name}</p>
          ${sellerAgent.phone ? `<p style="margin:4px 0 0;font-size:13px;color:#555">📞 ${sellerAgent.phone}</p>` : ''}
          ${sellerAgent.whatsapp ? `<p style="margin:4px 0 0;font-size:13px;color:#555">💬 <a href="https://wa.me/${sellerAgent.whatsapp}" style="color:#25D366">WhatsApp</a></p>` : ''}
          <p style="margin:4px 0 0;font-size:13px;color:#555">✉️ <a href="mailto:${sellerAgentEmail}" style="color:#f97316">${sellerAgentEmail}</a></p>
        </div>` : ''

      await resend.emails.send({
        from: 'Habiteo Matching <invitation@e-mo-tec.com>',
        to: buyerAgentEmail,
        subject: `🔔 Match ${score}% — ${buyer.name} ↔ ${property.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#f97316;padding:24px;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:22px">🔔 Nouveau match Habiteo</h1>
              ${isInterAgent ? '<p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px">Match inter-agents</p>' : ''}
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
              ${sellerContact}
            </div>
          </div>`,
      }).catch(console.error)
    }

    // Email à l'agent vendeur (uniquement si inter-agents)
    if (isInterAgent && sellerAgentEmail && sellerAgentEmail !== buyerAgentEmail) {
      const buyerContact = buyerAgent ? `
        <div style="margin-top:24px;background:#f9fafb;border:1px solid #eee;border-radius:10px;padding:16px">
          <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:0.05em">Agent à contacter</p>
          <p style="margin:0;font-weight:600;color:#111">${buyerAgent.name}</p>
          ${buyerAgent.phone ? `<p style="margin:4px 0 0;font-size:13px;color:#555">📞 ${buyerAgent.phone}</p>` : ''}
          ${buyerAgent.whatsapp ? `<p style="margin:4px 0 0;font-size:13px;color:#555">💬 <a href="https://wa.me/${buyerAgent.whatsapp}" style="color:#25D366">WhatsApp</a></p>` : ''}
          <p style="margin:4px 0 0;font-size:13px;color:#555">✉️ <a href="mailto:${buyerAgentEmail}" style="color:#f97316">${buyerAgentEmail}</a></p>
        </div>` : ''

      await resend.emails.send({
        from: 'Habiteo Matching <invitation@e-mo-tec.com>',
        to: sellerAgentEmail,
        subject: `🔔 Match ${score}% — Acheteur potentiel pour "${property.title}"`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
            <div style="background:#f97316;padding:24px;border-radius:12px 12px 0 0">
              <h1 style="color:white;margin:0;font-size:22px">🔔 Un confrère a un acheteur pour votre bien</h1>
            </div>
            <div style="background:white;padding:24px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
              <p style="font-size:32px;font-weight:bold;color:#f97316;margin:0 0 4px">${score}%</p>
              <p style="font-family:monospace;color:#999;font-size:13px;margin:0 0 24px">${scoreBar}</p>
              <h2 style="margin:0 0 8px;font-size:18px">Votre bien : ${property.title}</h2>
              <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:14px">
                <tr><td style="padding:6px 0;color:#666">Prix</td><td style="font-weight:bold">${priceFormatted}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Localisation</td><td>${[property.district, property.concelho].filter(Boolean).join(' › ') || property.location}</td></tr>
              </table>
              <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;margin-bottom:16px">
                <p style="margin:0;font-size:14px;color:#92400e">Un confrère a un acheteur dont les critères correspondent à <strong>${score}%</strong> à votre bien. Les coordonnées de l'acheteur restent confidentielles — contactez l'agent directement pour organiser une collaboration.</p>
              </div>
              <h3 style="margin:0 0 4px;font-size:15px">Critères généraux de l'acheteur</h3>
              <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
                <tr><td style="padding:6px 0;color:#666">Budget max</td><td>${buyer.budget_max ? new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(buyer.budget_max) : '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Type souhaité</td><td>${buyer.property_type || '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Zone</td><td>${[buyer.district, buyer.concelho].filter(Boolean).join(' › ') || '—'}</td></tr>
                <tr><td style="padding:6px 0;color:#666">Chambres min.</td><td>${buyer.bedrooms_min || '—'}</td></tr>
              </table>
              ${buyerContact}
            </div>
          </div>`,
      }).catch(console.error)
    }
  }
}
