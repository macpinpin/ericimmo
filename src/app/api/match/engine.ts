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

  // Budget 30%
  if (buyer.budget_min === null && buyer.budget_max === null) {
    score += 30
  } else {
    const inRange =
      (buyer.budget_min === null || property.price >= buyer.budget_min) &&
      (buyer.budget_max === null || property.price <= buyer.budget_max)
    if (inRange) score += 30
    else if (buyer.budget_max && property.price <= buyer.budget_max * 1.15) score += 15
  }

  // Type 20%
  if (!buyer.property_type || buyer.property_type === property.type) score += 20

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
  const propBeds = property.bedrooms ?? 0
  if (!buyer.bedrooms_min || propBeds >= buyer.bedrooms_min) score += 15

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

async function getAgentEmail(agentId: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.getUserById(agentId)
  return data?.user?.email ?? null
}

export async function runMatching() {
  const { data: buyers } = await supabase.from('buyers').select('*')
  const { data: properties } = await supabase.from('properties').select('*').eq('status', 'active')

  if (!buyers?.length || !properties?.length) return { matched: 0 }

  let newMatches = 0

  for (const buyer of buyers as Buyer[]) {
    for (const property of properties as Property[]) {
      const score = computeScore(buyer, property)
      if (score < 60) continue

      const { data: existing } = await supabase
        .from('matches')
        .select('id, notified_at')
        .eq('buyer_id', buyer.id)
        .eq('property_id', property.id)
        .maybeSingle()

      if (existing?.notified_at) continue

      const matchPayload = {
        buyer_id: buyer.id,
        property_id: property.id,
        buyer_agent_id: buyer.agent_id,
        seller_agent_id: property.agent_id,
        score,
        status: 'new',
        notified_at: new Date().toISOString(),
      }

      if (existing) {
        await supabase.from('matches').update(matchPayload).eq('id', existing.id)
      } else {
        await supabase.from('matches').insert(matchPayload)
      }

      const [buyerAgentEmail, sellerAgentEmail] = await Promise.all([
        getAgentEmail(buyer.agent_id),
        getAgentEmail(property.agent_id),
      ])

      const scoreBar = '█'.repeat(Math.round(score / 10)) + '░'.repeat(10 - Math.round(score / 10))
      const priceFormatted = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(property.price)

      if (buyerAgentEmail) {
        await resend.emails.send({
          from: 'Habiteo Matching <noreply@habiteo.com>',
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
                  <tr><td style="padding:6px 0;color:#666">Budget</td><td>${buyer.budget_min ? new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(buyer.budget_min) : '—'} → ${buyer.budget_max ? new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(buyer.budget_max) : '—'}</td></tr>
                  <tr><td style="padding:6px 0;color:#666">Type</td><td>${buyer.property_type || '—'}</td></tr>
                  <tr><td style="padding:6px 0;color:#666">Localisation</td><td>${[buyer.district, buyer.concelho].filter(Boolean).join(' › ') || '—'}</td></tr>
                  <tr><td style="padding:6px 0;color:#666">Chambres min</td><td>${buyer.bedrooms_min || '—'}</td></tr>
                </table>
                <h2 style="margin:0 0 8px;font-size:18px">Bien correspondant : ${property.title}</h2>
                <table style="width:100%;border-collapse:collapse;font-size:14px">
                  <tr><td style="padding:6px 0;color:#666">Prix</td><td style="font-weight:bold">${priceFormatted}</td></tr>
                  <tr><td style="padding:6px 0;color:#666">Type</td><td>${property.type}</td></tr>
                  <tr><td style="padding:6px 0;color:#666">Localisation</td><td>${[property.district, property.concelho].filter(Boolean).join(' › ') || property.location}</td></tr>
                  <tr><td style="padding:6px 0;color:#666">Chambres</td><td>${property.bedrooms || '—'}</td></tr>
                  ${property.is_offmarket ? '<tr><td style="padding:6px 0;color:#666">Statut</td><td><span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:4px;font-size:12px">🔒 Off-market</span></td></tr>' : ''}
                </table>
                <p style="margin-top:24px;color:#666;font-size:13px">Connectez-vous à votre dashboard Habiteo pour voir ce match.</p>
              </div>
            </div>`,
        })
      }

      if (property.is_offmarket && sellerAgentEmail && sellerAgentEmail !== buyerAgentEmail) {
        await resend.emails.send({
          from: 'Habiteo Matching <noreply@habiteo.com>',
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
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px">
                  <tr><td style="padding:6px 0;color:#666">Référence</td><td>${property.ref || '—'}</td></tr>
                  <tr><td style="padding:6px 0;color:#666">Prix</td><td style="font-weight:bold">${priceFormatted}</td></tr>
                  <tr><td style="padding:6px 0;color:#666">Localisation</td><td>${[property.district, property.concelho].filter(Boolean).join(' › ') || property.location}</td></tr>
                </table>
                <p style="color:#444;font-size:14px">Un confrère Habiteo a un acheteur dont le profil correspond à <strong>${score}%</strong> à votre bien off-market.</p>
              </div>
            </div>`,
        })
      }

      newMatches++
    }
  }

  return { matched: newMatches, buyers: buyers.length, properties: properties.length }
}
