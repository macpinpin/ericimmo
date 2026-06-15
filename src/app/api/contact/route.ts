import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { name, email, phone, message, agentEmail, propertyTitle, propertyUrl } = await req.json()
  if (!email || !name || !agentEmail) return Response.json({ error: 'Champs requis manquants' }, { status: 400 })

  const { error } = await resend.emails.send({
    from: 'Habiteo Leads <invitation@e-mo-tec.com>',
    to: agentEmail,
    reply_to: email,
    subject: `🏠 Nouveau lead — ${propertyTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#f97316;padding:24px 32px;border-radius:12px 12px 0 0">
          <h1 style="color:white;margin:0;font-size:22px">🏠 Nouveau lead Habiteo</h1>
          <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px">${propertyTitle}</p>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#999;font-size:13px;width:120px">Nom</td><td style="padding:8px 0;font-weight:600;color:#111">${name}</td></tr>
            <tr><td style="padding:8px 0;color:#999;font-size:13px">Email</td><td style="padding:8px 0"><a href="mailto:${email}" style="color:#f97316">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding:8px 0;color:#999;font-size:13px">Téléphone</td><td style="padding:8px 0;font-weight:600;color:#111">${phone}</td></tr>` : ''}
            ${message ? `<tr><td style="padding:8px 0;color:#999;font-size:13px;vertical-align:top">Message</td><td style="padding:8px 0;color:#333">${message}</td></tr>` : ''}
          </table>
          ${propertyUrl ? `
          <div style="margin-top:24px">
            <a href="${propertyUrl}" style="display:inline-block;background:#f97316;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:bold;font-size:14px">
              Voir l'annonce →
            </a>
          </div>` : ''}
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
          <p style="color:#ccc;font-size:12px;text-align:center">Lead reçu via Habiteo · Répondez directement à ${email}</p>
        </div>
      </div>`,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
