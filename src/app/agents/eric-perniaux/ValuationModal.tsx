'use client'

import { useState } from 'react'
import { type Lang } from '@/lib/translations'

const LABELS: Record<string, Record<string, string>> = {
  fr: {
    title: 'Évaluation gratuite de votre bien',
    subtitle: 'Recevez une estimation professionnelle sous 24h',
    name: 'Nom complet *', namePh: 'Jean Dupont',
    email: 'Email *', emailPh: 'jean@exemple.com',
    phone: 'Téléphone / WhatsApp', phonePh: '+33 6 00 00 00 00',
    type: 'Type de bien *',
    villa: 'Villa / Maison', apt: 'Appartement', land: 'Terrain', commercial: 'Commercial', other: 'Autre',
    address: 'Adresse du bien *', addressPh: 'Rua do Mar, Carvoeiro, Algarve',
    area: 'Surface habitable (m²)', areaMin: 'Ex: 150',
    plot: 'Terrain (m²)', plotPh: 'Ex: 500',
    bedrooms: 'Nombre de chambres',
    bed0: 'Studio', bed1: '1 chambre', bed2: '2 chambres', bed3: '3 chambres', bed4: '4 chambres', bed5: '5+',
    condition: 'État du bien *',
    cond1: '✨ Excellent état', cond2: '👍 Bon état', cond3: '🔨 À rénover',
    timeline: 'Délai de vente souhaité',
    time1: '⚡ Urgent (< 3 mois)', time2: '📅 3 à 6 mois', time3: '🕐 Pas pressé',
    message: 'Informations complémentaires', messagePh: 'Décrivez votre bien, ses atouts, vos questions…',
    submit: 'Demander mon évaluation gratuite',
    sending: 'Envoi en cours…',
    success: '✅ Demande envoyée ! Eric vous contactera sous 24h.',
    error: 'Erreur lors de l\'envoi. Réessayez ou contactez directement Eric.',
    close: 'Fermer',
  },
  pt: {
    title: 'Avaliação gratuita do seu imóvel',
    subtitle: 'Receba uma estimativa profissional em 24h',
    name: 'Nome completo *', namePh: 'João Silva',
    email: 'Email *', emailPh: 'joao@exemplo.com',
    phone: 'Telefone / WhatsApp', phonePh: '+351 9XX XXX XXX',
    type: 'Tipo de imóvel *',
    villa: 'Moradia', apt: 'Apartamento', land: 'Terreno', commercial: 'Comercial', other: 'Outro',
    address: 'Morada do imóvel *', addressPh: 'Rua do Mar, Carvoeiro, Algarve',
    area: 'Área habitável (m²)', areaMin: 'Ex: 150',
    plot: 'Terreno (m²)', plotPh: 'Ex: 500',
    bedrooms: 'Número de quartos',
    bed0: 'Estúdio', bed1: '1 quarto', bed2: '2 quartos', bed3: '3 quartos', bed4: '4 quartos', bed5: '5+',
    condition: 'Estado do imóvel *',
    cond1: '✨ Excelente', cond2: '👍 Bom estado', cond3: '🔨 Para renovar',
    timeline: 'Prazo de venda desejado',
    time1: '⚡ Urgente (< 3 meses)', time2: '📅 3 a 6 meses', time3: '🕐 Sem pressa',
    message: 'Informações adicionais', messagePh: 'Descreva o seu imóvel, os seus pontos fortes…',
    submit: 'Pedir avaliação gratuita',
    sending: 'A enviar…',
    success: '✅ Pedido enviado! Eric contactará em 24h.',
    error: 'Erro ao enviar. Tente novamente ou contacte Eric diretamente.',
    close: 'Fechar',
  },
  en: {
    title: 'Free property valuation',
    subtitle: 'Receive a professional estimate within 24h',
    name: 'Full name *', namePh: 'John Smith',
    email: 'Email *', emailPh: 'john@example.com',
    phone: 'Phone / WhatsApp', phonePh: '+44 7700 000000',
    type: 'Property type *',
    villa: 'Villa / House', apt: 'Apartment', land: 'Land', commercial: 'Commercial', other: 'Other',
    address: 'Property address *', addressPh: 'Rua do Mar, Carvoeiro, Algarve',
    area: 'Living area (m²)', areaMin: 'E.g. 150',
    plot: 'Land (m²)', plotPh: 'E.g. 500',
    bedrooms: 'Number of bedrooms',
    bed0: 'Studio', bed1: '1 bedroom', bed2: '2 bedrooms', bed3: '3 bedrooms', bed4: '4 bedrooms', bed5: '5+',
    condition: 'Property condition *',
    cond1: '✨ Excellent', cond2: '👍 Good condition', cond3: '🔨 Needs renovation',
    timeline: 'Desired sale timeline',
    time1: '⚡ Urgent (< 3 months)', time2: '📅 3 to 6 months', time3: '🕐 No rush',
    message: 'Additional information', messagePh: 'Describe your property, its features, your questions…',
    submit: 'Request my free valuation',
    sending: 'Sending…',
    success: '✅ Request sent! Eric will contact you within 24h.',
    error: 'Error sending. Please try again or contact Eric directly.',
    close: 'Close',
  },
  de: {
    title: 'Kostenlose Immobilienbewertung',
    subtitle: 'Erhalten Sie eine professionelle Schätzung innerhalb von 24h',
    name: 'Vollständiger Name *', namePh: 'Hans Müller',
    email: 'E-Mail *', emailPh: 'hans@beispiel.de',
    phone: 'Telefon / WhatsApp', phonePh: '+49 170 0000000',
    type: 'Immobilientyp *',
    villa: 'Villa / Haus', apt: 'Wohnung', land: 'Grundstück', commercial: 'Gewerblich', other: 'Sonstiges',
    address: 'Adresse der Immobilie *', addressPh: 'Rua do Mar, Carvoeiro, Algarve',
    area: 'Wohnfläche (m²)', areaMin: 'Z.B. 150',
    plot: 'Grundstück (m²)', plotPh: 'Z.B. 500',
    bedrooms: 'Anzahl Schlafzimmer',
    bed0: 'Studio', bed1: '1 Zimmer', bed2: '2 Zimmer', bed3: '3 Zimmer', bed4: '4 Zimmer', bed5: '5+',
    condition: 'Zustand der Immobilie *',
    cond1: '✨ Ausgezeichnet', cond2: '👍 Guter Zustand', cond3: '🔨 Renovierungsbedarf',
    timeline: 'Gewünschter Verkaufszeitraum',
    time1: '⚡ Dringend (< 3 Monate)', time2: '📅 3 bis 6 Monate', time3: '🕐 Kein Eile',
    message: 'Weitere Informationen', messagePh: 'Beschreiben Sie Ihre Immobilie…',
    submit: 'Kostenlose Bewertung anfragen',
    sending: 'Wird gesendet…',
    success: '✅ Anfrage gesendet! Eric meldet sich innerhalb von 24h.',
    error: 'Fehler beim Senden. Bitte versuchen Sie es erneut.',
    close: 'Schließen',
  },
  nl: {
    title: 'Gratis waardebepaling',
    subtitle: 'Ontvang een professionele schatting binnen 24u',
    name: 'Volledige naam *', namePh: 'Jan de Vries',
    email: 'E-mail *', emailPh: 'jan@voorbeeld.nl',
    phone: 'Telefoon / WhatsApp', phonePh: '+31 6 00000000',
    type: 'Type woning *',
    villa: 'Villa / Huis', apt: 'Appartement', land: 'Grond', commercial: 'Commercieel', other: 'Anders',
    address: 'Adres van het pand *', addressPh: 'Rua do Mar, Carvoeiro, Algarve',
    area: 'Woonoppervlak (m²)', areaMin: 'Bijv. 150',
    plot: 'Grond (m²)', plotPh: 'Bijv. 500',
    bedrooms: 'Aantal slaapkamers',
    bed0: 'Studio', bed1: '1 slaapkamer', bed2: '2 slaapkamers', bed3: '3 slaapkamers', bed4: '4 slaapkamers', bed5: '5+',
    condition: 'Staat van het pand *',
    cond1: '✨ Uitstekend', cond2: '👍 Goede staat', cond3: '🔨 Renovatie nodig',
    timeline: 'Gewenste verkooptermijn',
    time1: '⚡ Dringend (< 3 maanden)', time2: '📅 3 tot 6 maanden', time3: '🕐 Geen haast',
    message: 'Aanvullende informatie', messagePh: 'Beschrijf uw woning, de voordelen…',
    submit: 'Gratis waardebepaling aanvragen',
    sending: 'Verzenden…',
    success: '✅ Aanvraag verzonden! Eric neemt binnen 24u contact op.',
    error: 'Fout bij verzenden. Probeer opnieuw of neem direct contact op.',
    close: 'Sluiten',
  },
  zh: {
    title: '免费房产估价',
    subtitle: '24小时内获得专业估价',
    name: '全名 *', namePh: '张伟',
    email: '电子邮件 *', emailPh: 'zhang@example.com',
    phone: '电话 / WhatsApp', phonePh: '+86 138 0000 0000',
    type: '房产类型 *',
    villa: '别墅 / 住宅', apt: '公寓', land: '土地', commercial: '商业', other: '其他',
    address: '房产地址 *', addressPh: 'Rua do Mar, Carvoeiro, Algarve',
    area: '居住面积 (m²)', areaMin: '例如: 150',
    plot: '地块 (m²)', plotPh: '例如: 500',
    bedrooms: '卧室数量',
    bed0: '开放式', bed1: '1间卧室', bed2: '2间卧室', bed3: '3间卧室', bed4: '4间卧室', bed5: '5间以上',
    condition: '房产状况 *',
    cond1: '✨ 极佳', cond2: '👍 良好', cond3: '🔨 需要翻新',
    timeline: '期望出售时间',
    time1: '⚡ 紧急 (< 3个月)', time2: '📅 3至6个月', time3: '🕐 不急',
    message: '补充信息', messagePh: '描述您的房产、优势、您的问题…',
    submit: '申请免费估价',
    sending: '发送中…',
    success: '✅ 申请已发送！Eric将在24小时内联系您。',
    error: '发送失败，请重试或直接联系Eric。',
    close: '关闭',
  },
}

export default function ValuationModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const L = LABELS[lang] || LABELS.fr
  const [form, setForm] = useState({
    name: '', email: '', phone: '', propertyType: '',
    address: '', area: '', plot: '', bedrooms: '',
    condition: '', timeline: '', message: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, lang }),
      })
      const data = await res.json()
      if (data.success) setSuccess(true)
      else setError(L.error)
    } catch {
      setError(L.error)
    }
    setLoading(false)
  }

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors bg-white"
  const lbl = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-orange-500 text-white px-6 py-5 rounded-t-2xl flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{L.title}</h2>
            <p className="text-orange-100 text-sm mt-1">{L.subtitle}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none ml-4">✕</button>
        </div>

        {success ? (
          <div className="p-10 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-lg font-semibold text-gray-900 mb-2">{L.success}</p>
            <button onClick={onClose} className="mt-6 bg-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors">
              {L.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">

            {/* Nom + Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>{L.name}</label>
                <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder={L.namePh} required />
              </div>
              <div>
                <label className={lbl}>{L.email}</label>
                <input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder={L.emailPh} required />
              </div>
            </div>

            {/* Téléphone + Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>{L.phone}</label>
                <input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder={L.phonePh} />
              </div>
              <div>
                <label className={lbl}>{L.type}</label>
                <select className={inp} value={form.propertyType} onChange={e => set('propertyType', e.target.value)} required>
                  <option value="">—</option>
                  <option value={L.villa}>{L.villa}</option>
                  <option value={L.apt}>{L.apt}</option>
                  <option value={L.land}>{L.land}</option>
                  <option value={L.commercial}>{L.commercial}</option>
                  <option value={L.other}>{L.other}</option>
                </select>
              </div>
            </div>

            {/* Adresse */}
            <div>
              <label className={lbl}>{L.address}</label>
              <input className={inp} value={form.address} onChange={e => set('address', e.target.value)} placeholder={L.addressPh} required />
            </div>

            {/* Surface + Terrain + Chambres */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={lbl}>{L.area}</label>
                <input className={inp} type="number" value={form.area} onChange={e => set('area', e.target.value)} placeholder={L.areaMin} />
              </div>
              <div>
                <label className={lbl}>{L.plot}</label>
                <input className={inp} type="number" value={form.plot} onChange={e => set('plot', e.target.value)} placeholder={L.plotPh} />
              </div>
              <div>
                <label className={lbl}>{L.bedrooms}</label>
                <select className={inp} value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)}>
                  <option value="">—</option>
                  <option value={L.bed0}>{L.bed0}</option>
                  <option value={L.bed1}>{L.bed1}</option>
                  <option value={L.bed2}>{L.bed2}</option>
                  <option value={L.bed3}>{L.bed3}</option>
                  <option value={L.bed4}>{L.bed4}</option>
                  <option value={L.bed5}>{L.bed5}</option>
                </select>
              </div>
            </div>

            {/* État + Délai */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>{L.condition}</label>
                <select className={inp} value={form.condition} onChange={e => set('condition', e.target.value)} required>
                  <option value="">—</option>
                  <option value={L.cond1}>{L.cond1}</option>
                  <option value={L.cond2}>{L.cond2}</option>
                  <option value={L.cond3}>{L.cond3}</option>
                </select>
              </div>
              <div>
                <label className={lbl}>{L.timeline}</label>
                <select className={inp} value={form.timeline} onChange={e => set('timeline', e.target.value)}>
                  <option value="">—</option>
                  <option value={L.time1}>{L.time1}</option>
                  <option value={L.time2}>{L.time2}</option>
                  <option value={L.time3}>{L.time3}</option>
                </select>
              </div>
            </div>

            {/* Message */}
            <div>
              <label className={lbl}>{L.message}</label>
              <textarea className={`${inp} resize-none`} rows={3} value={form.message} onChange={e => set('message', e.target.value)} placeholder={L.messagePh} />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm">
              {loading ? L.sending : L.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
