import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const data = await req.json()

  const {
    name, email, phone, propertyType, address,
    area, plot, bedrooms, condition, timeline, message, lang
  } = data

  const labels: Record<string, Record<string, string>> = {
    fr: {
      subject: `🏠 Demande d'évaluation gratuite — ${name}`,
      propertyType: 'Type de bien',
      address: 'Adresse du bien',
      area: 'Surface habitable',
      plot: 'Terrain',
      bedrooms: 'Chambres',
      condition: 'État du bien',
      timeline: 'Délai souhaité',
      message: 'Message',
      phone: 'Téléphone',
    },
    en: {
      subject: `🏠 Free Valuation Request — ${name}`,
      propertyType: 'Property type',
      address: 'Property address',
      area: 'Living area',
      plot: 'Land',
      bedrooms: 'Bedrooms',
      condition: 'Property condition',
      timeline: 'Desired timeline',
      message: 'Message',
      phone: 'Phone',
    },
  }

  const L = labels[lang] || labels.fr

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#f26522;padding:24px;border-radius:12px 12px 0 0">
        <h1 style="color:white;margin:0;font-size:22px">🏠 Demande d'évaluation gratuite</h1>
      </div>
      <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#6b7280;width:40%"><strong>Nom</strong></td><td style="padding:8px 0">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280"><strong>Email</strong></td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280"><strong>${L.phone}</strong></td><td style="padding:8px 0">${phone || '—'}</td></tr>
          <tr><td colspan="2"><hr style="border:none;border-top:1px solid #e5e7eb;margin:8px 0"></td></tr>
          <tr><td style="padding:8px 0;color:#6b7280"><strong>${L.propertyType}</strong></td><td style="padding:8px 0">${propertyType || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280"><strong>${L.address}</strong></td><td style="padding:8px 0">${address || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280"><strong>${L.area}</strong></td><td style="padding:8px 0">${area ? area + ' m²' : '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280"><strong>${L.plot}</strong></td><td style="padding:8px 0">${plot ? plot + ' m²' : '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280"><strong>${L.bedrooms}</strong></td><td style="padding:8px 0">${bedrooms || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280"><strong>${L.condition}</strong></td><td style="padding:8px 0">${condition || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280"><strong>${L.timeline}</strong></td><td style="padding:8px 0">${timeline || '—'}</td></tr>
          ${message ? `<tr><td colspan="2" style="padding:8px 0"><strong>${L.message}</strong><br><div style="background:white;padding:12px;border-radius:8px;margin-top:6px;border:1px solid #e5e7eb">${message}</div></td></tr>` : ''}
        </table>
        <div style="margin-top:20px;text-align:center">
          <a href="mailto:${email}" style="background:#f26522;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Répondre à ${name}
          </a>
        </div>
      </div>
      <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px">Eric Perniaux · SAFTI Portugal · ericimmo.vercel.app</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: 'EricImmo <onboarding@resend.dev>',
      to: 'macpinpin@me.com',
      replyTo: email,
      subject: L.subject,
      html,
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Email error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
