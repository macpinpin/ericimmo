'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Property, Agent } from '@/lib/types'
import { PropertyCard, PropertyModal } from '@/components/PropertyCard'
import { LANGS, t, type Lang } from '@/lib/translations'
import { getDistricts, getConcelhos, getFreguesias } from '@/lib/portugal'

const FILTER_LABELS: Record<string, Record<string, string>> = {
  district: { fr: 'Région', pt: 'Distrito', en: 'District', de: 'Bezirk', nl: 'District', zh: '地区' },
  concelho: { fr: 'Commune', pt: 'Concelho', en: 'Municipality', de: 'Gemeinde', nl: 'Gemeente', zh: '市镇' },
  freguesia: { fr: 'Quartier', pt: 'Freguesia', en: 'Parish', de: 'Gemeindebezirk', nl: 'Parochie', zh: '教区' },
  type: { fr: 'Type de bien', pt: 'Tipo de imóvel', en: 'Property type', de: 'Immobilientyp', nl: 'Type woning', zh: '房产类型' },
  bedrooms: { fr: 'Chambres min.', pt: 'Quartos mín.', en: 'Min. bedrooms', de: 'Mind. Zimmer', nl: 'Min. slaapk.', zh: '最少卧室' },
  minArea: { fr: 'Surface min. (m²)', pt: 'Área mín. (m²)', en: 'Min. area (m²)', de: 'Mind. Fläche (m²)', nl: 'Min. opp. (m²)', zh: '最小面积 (m²)' },
  maxArea: { fr: 'Surface max. (m²)', pt: 'Área máx. (m²)', en: 'Max. area (m²)', de: 'Max. Fläche (m²)', nl: 'Max. opp. (m²)', zh: '最大面积 (m²)' },
  minPrice: { fr: 'Prix min. (€)', pt: 'Preço mín. (€)', en: 'Min. price (€)', de: 'Min. Preis (€)', nl: 'Min. prijs (€)', zh: '最低价格 (€)' },
  maxPrice: { fr: 'Prix max. (€)', pt: 'Preço máx. (€)', en: 'Max. price (€)', de: 'Max. Preis (€)', nl: 'Max. prijs (€)', zh: '最高价格 (€)' },
  reset: { fr: 'Réinitialiser', pt: 'Reiniciar', en: 'Reset', de: 'Zurücksetzen', nl: 'Resetten', zh: '重置' },
  allTypes: { fr: 'Tous les types', pt: 'Todos os tipos', en: 'All types', de: 'Alle Typen', nl: 'Alle types', zh: '所有类型' },
  allBeds: { fr: 'Peu importe', pt: 'Qualquer', en: 'Any', de: 'Egal', nl: 'Maakt niet uit', zh: '不限' },
  noResult: { fr: 'Aucun bien ne correspond à vos critères.', pt: 'Nenhum imóvel corresponde aos seus critérios.', en: 'No properties match your criteria.', de: 'Keine Immobilien entsprechen Ihren Kriterien.', nl: 'Geen woningen voldoen aan uw criteria.', zh: '没有符合您条件的房产。' },
}

function fl(key: string, lang: string) {
  return FILTER_LABELS[key]?.[lang] || FILTER_LABELS[key]?.['fr'] || key
}

export default function AgentSlugPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [agent, setAgent] = useState<Agent | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [selected, setSelected] = useState<Property | null>(null)
  const [fromDirectLink, setFromDirectLink] = useState(false)
  const [lang, setLang] = useState<Lang>('fr')
  const [langOpen, setLangOpen] = useState(false)
  const [pendingBienId, setPendingBienId] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    district: '', concelho: '', freguesia: '',
    type: '', bedrooms: '', minArea: '', maxArea: '', minPrice: '', maxPrice: '',
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const bienId = params.get('bien')
    if (bienId) setPendingBienId(bienId)
    const saved = localStorage.getItem('ep_lang') as Lang
    if (saved) setLang(saved)
  }, [])

  useEffect(() => {
    if (!slug) return
    supabase
      .from('agents')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); return }
        setAgent(data as Agent)
        supabase
          .from('properties')
          .select('*')
          .eq('agent_id', data.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .then(({ data: props }) => setProperties((props || []) as Property[]))
      })
  }, [slug])

  useEffect(() => {
    if (pendingBienId && properties.length > 0) {
      const prop = properties.find(p => p.id === pendingBienId)
      if (prop) { setSelected(prop); setFromDirectLink(true) }
      setPendingBienId(null)
    }
  }, [pendingBienId, properties])

  function switchLang(code: string) {
    setLang(code as Lang)
    localStorage.setItem('ep_lang', code)
    setLangOpen(false)
  }

  function setFilter(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function resetFilters() {
    setFilters({ district: '', concelho: '', freguesia: '', type: '', bedrooms: '', minArea: '', maxArea: '', minPrice: '', maxPrice: '' })
  }

  const districts = useMemo(() => getDistricts(), [])
  const concelhos = useMemo(() => getConcelhos(filters.district), [filters.district])
  const freguesias = useMemo(() => getFreguesias(filters.district, filters.concelho), [filters.district, filters.concelho])

  const filtered = useMemo(() => properties.filter(p => {
    if (filters.district && p.district !== filters.district) return false
    if (filters.concelho && p.concelho !== filters.concelho) return false
    if (filters.freguesia && p.freguesia !== filters.freguesia) return false
    if (filters.type && p.type !== filters.type) return false
    if (filters.bedrooms && (p.bedrooms || 0) < parseInt(filters.bedrooms)) return false
    if (filters.minArea) {
      const area = p.area_bruta_privativa || p.area_utile || 0
      if (area < parseFloat(filters.minArea)) return false
    }
    if (filters.maxArea) {
      const area = p.area_bruta_privativa || p.area_utile || 0
      if (area > parseFloat(filters.maxArea)) return false
    }
    if (filters.minPrice && p.price < parseFloat(filters.minPrice)) return false
    if (filters.maxPrice && p.price > parseFloat(filters.maxPrice)) return false
    return true
  }), [properties, filters])

  const hasFilters = Object.values(filters).some(v => v !== '')
  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0]
  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors bg-white"

  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-6xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Agent introuvable</h1>
          <p className="text-gray-500">Aucun agent ne correspond à cette adresse.</p>
        </div>
      </main>
    )
  }

  if (!agent) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center text-gray-400">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">Chargement...</p>
        </div>
      </main>
    )
  }

  const agentContact = {
    email: agent.contact_email || agent.email,
    phone: agent.phone || '',
    whatsapp: agent.whatsapp || '',
    slug: agent.slug || slug,
  }

  const bio = agent.bio_translations?.[lang] || agent.bio || ''
  const poweredBy = agent.powered_by || 'Powered by SAFTI'

  return (
    <main className="min-h-screen bg-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header orange */}
      <div className="bg-orange-500 text-white relative overflow-hidden" style={{minHeight: '200px'}}>

        {/* Sélecteur de langue */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setLangOpen(o => !o)}
            className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
          >
            <span>{currentLang.flag}</span>
            <span>{currentLang.label}</span>
            <span className="text-xs">▾</span>
          </button>
          {langOpen && (
            <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 grid grid-cols-2 w-44">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => switchLang(l.code)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-orange-50 transition-colors ${lang === l.code ? 'text-orange-500 font-semibold' : 'text-gray-700'}`}
                >
                  <span>{l.flag}</span><span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layout desktop */}
        <div className="hidden md:block relative" style={{minHeight: '224px'}}>
          {agent.photo_url && (
            <div className="absolute top-1/2 -translate-y-1/2" style={{left: '80px'}}>
              <img
                src={agent.photo_url}
                alt={agent.name}
                style={{height: '230px', width: '230px'}}
                className="rounded-full border-4 border-white object-cover object-top shadow-xl"
              />
            </div>
          )}
          <div className="w-full flex flex-col items-center justify-center py-6" style={{minHeight: '224px'}}>
            <div className="inline-flex flex-col items-end mb-2">
              <h1 className="text-6xl font-bold tracking-tight">{agent.name}</h1>
              <p className="text-white/60 text-xs font-medium mt-0.5">{poweredBy}</p>
            </div>
            {bio && (
              <p className="text-white text-base leading-relaxed mb-10 mt-6 text-center max-w-lg whitespace-pre-line">{bio}</p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              {agent.phone && (
                <a href={`tel:${agent.phone}`} className="bg-white text-orange-500 font-semibold px-4 py-2 rounded-xl text-sm hover:bg-orange-50 transition-colors flex items-center gap-1.5">
                  📞 {agent.phone}
                </a>
              )}
              {agent.whatsapp && (
                <a href={`https://wa.me/${agent.whatsapp}`} target="_blank" rel="noopener" className="bg-green-500 text-white font-semibold px-4 py-2 rounded-xl text-sm hover:bg-green-600 transition-colors flex items-center gap-1.5">
                  💬 WhatsApp
                </a>
              )}
              <a href={`mailto:${agent.contact_email || agent.email}`} className="bg-white/15 hover:bg-white/25 border border-white/40 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-1.5">
                ✉️ Email
              </a>
            </div>
          </div>
        </div>

        {/* Layout mobile */}
        <div className="flex md:hidden flex-col items-center text-center px-6 py-8 gap-4">
          {agent.photo_url && (
            <img src={agent.photo_url} alt={agent.name} className="w-32 h-32 rounded-full border-4 border-white object-cover object-top shadow-xl" />
          )}
          <div>
            <h1 className="text-3xl font-bold mb-0.5">{agent.name}</h1>
            <p className="text-white/60 text-xs mb-3">{poweredBy}</p>
            {bio && <p className="text-white text-sm leading-relaxed mb-4 opacity-90 whitespace-pre-line">{bio}</p>}
            <div className="flex flex-wrap justify-center gap-2">
              {agent.phone && <a href={`tel:${agent.phone}`} className="bg-white text-orange-500 font-semibold px-4 py-2 rounded-xl text-sm">📞 {agent.phone}</a>}
              {agent.whatsapp && <a href={`https://wa.me/${agent.whatsapp}`} target="_blank" rel="noopener" className="bg-green-500 text-white font-semibold px-4 py-2 rounded-xl text-sm">💬 WhatsApp</a>}
              <a href={`mailto:${agent.contact_email || agent.email}`} className="bg-white/15 border border-white/40 text-white font-semibold px-4 py-2 rounded-xl text-sm">✉️ Email</a>
            </div>
          </div>
        </div>

      </div>

      {/* Filtres */}
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('district', lang)}</label>
              <select className={inp} value={filters.district} onChange={e => { setFilter('district', e.target.value); setFilter('concelho', ''); setFilter('freguesia', '') }}>
                <option value="">—</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('concelho', lang)}</label>
              <select className={inp} value={filters.concelho} onChange={e => { setFilter('concelho', e.target.value); setFilter('freguesia', '') }}>
                <option value="">—</option>
                {concelhos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('freguesia', lang)}</label>
              <select className={inp} value={filters.freguesia} onChange={e => setFilter('freguesia', e.target.value)}>
                <option value="">—</option>
                {freguesias.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('type', lang)}</label>
              <select className={inp} value={filters.type} onChange={e => setFilter('type', e.target.value)}>
                <option value="">{fl('allTypes', lang)}</option>
                <option value="villa">Villa / Maison</option>
                <option value="apartment">Appartement</option>
                <option value="land">Terrain</option>
                <option value="commercial">Commercial</option>
                <option value="other">Autre</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('bedrooms', lang)}</label>
              <select className={inp} value={filters.bedrooms} onChange={e => setFilter('bedrooms', e.target.value)}>
                <option value="">{fl('allBeds', lang)}</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[110px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('minArea', lang)}</label>
              <input className={inp} type="number" value={filters.minArea} onChange={e => setFilter('minArea', e.target.value)} placeholder="Ex: 100" />
            </div>
            <div className="flex-1 min-w-[110px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('maxArea', lang)}</label>
              <input className={inp} type="number" value={filters.maxArea} onChange={e => setFilter('maxArea', e.target.value)} placeholder="Ex: 500" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('minPrice', lang)}</label>
              <input className={inp} type="number" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} placeholder="Ex: 100 000" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('maxPrice', lang)}</label>
              <input className={inp} type="number" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} placeholder="Ex: 500 000" />
            </div>
            {hasFilters && (
              <div className="flex-shrink-0">
                <button onClick={resetFilters} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
                  ✕ {fl('reset', lang)}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Biens */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('myProperties', lang)} <span className="text-orange-500">({filtered.length}{hasFilters ? `/${properties.length}` : ''})</span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>{hasFilters ? fl('noResult', lang) : t('noBiens', lang)}</p>
            {hasFilters && (
              <button onClick={resetFilters} className="mt-4 text-orange-500 hover:underline text-sm font-medium">
                {fl('reset', lang)}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <PropertyCard key={p.id} p={p} lang={lang} onOpen={() => setSelected(p)} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <PropertyModal
          p={selected}
          lang={lang}
          fromDirectLink={fromDirectLink}
          agent={agentContact}
          onClose={() => {
            setSelected(null)
            setFromDirectLink(false)
            if (fromDirectLink) window.history.replaceState({}, '', window.location.pathname)
          }}
        />
      )}
    </main>
  )
}
