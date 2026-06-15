import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { name, email } = await req.json()
  if (!email) return Response.json({ error: 'Email requis' }, { status: 400 })

  const { error } = await resend.emails.send({
    from: 'Eric Perniaux — Habiteo <invitation@e-mo-tec.com>',
    to: email,
    subject: `🏠 Votre invitation à rejoindre Habiteo`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#f97316;padding:32px;border-radius:12px 12px 0 0;text-align:center">
          <h1 style="color:white;margin:0;font-size:28px">🏠 Habiteo</h1>
          <p style="color:white/80;margin:8px 0 0;font-size:14px">Plateforme immobilière pour agents</p>
        </div>
        <div style="background:white;padding:32px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:16px;color:#333">Bonjour${name ? ' ' + name : ''},</p>
          <p style="color:#555;line-height:1.6">Eric Perniaux vous invite à rejoindre <strong>Habiteo</strong>, la plateforme de matching immobilier pour agents professionnels.</p>

          <div style="background:#f9fafb;border:1px solid #eee;border-radius:12px;padding:20px;margin:24px 0">
            <p style="margin:0 0 8px;font-size:13px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:0.05em">Votre code d'accès beta</p>
            <p style="margin:0;font-size:28px;font-weight:bold;color:#f97316;letter-spacing:0.1em">HABITEO2025</p>
          </div>

          <a href="https://ericimmo.vercel.app/register"
            style="display:block;background:#f97316;color:white;text-decoration:none;text-align:center;padding:16px;border-radius:12px;font-weight:bold;font-size:16px;margin:24px 0">
            Créer mon compte →
          </a>

          <p style="color:#999;font-size:13px;line-height:1.6">
            Une fois inscrit, vous aurez accès à votre dashboard pour gérer vos biens, vos acheteurs et recevoir des alertes de matching automatique.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0" />
          <p style="color:#ccc;font-size:12px;text-align:center">Habiteo · Plateforme beta · Invitation envoyée par Eric Perniaux</p>
        </div>
      </div>`,
  })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
