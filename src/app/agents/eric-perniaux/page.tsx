'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Property } from '@/lib/types'
import { PropertyCard, PropertyModal } from './PropertyCard'
import { LANGS, t, type Lang } from '@/lib/translations'
import ValuationModal from './ValuationModal'
import { getDistricts, getConcelhos, getFreguesias } from '@/lib/portugal'

const AGENT = {
  name: 'Eric Perniaux',
  phone: '+351 961 571 482',
  whatsapp: '351961571482',
  email: 'macpinpin@me.com',
  photo: '/agent.jpg',
  safti_url: 'https://www.safti.pt/consultor/eric-perniaux/33880427',
}

const FILTER_LABELS: Record<string, Record<string, string>> = {
  search: { fr: 'Rechercher', pt: 'Pesquisar', en: 'Search', de: 'Suchen', nl: 'Zoeken', zh: '搜索' },
  district: { fr: 'District', pt: 'Distrito', en: 'District', de: 'Bezirk', nl: 'District', zh: '地区' },
  concelho: { fr: 'Concelho', pt: 'Concelho', en: 'Municipality', de: 'Gemeinde', nl: 'Gemeente', zh: '市镇' },
  freguesia: { fr: 'Freguesia', pt: 'Freguesia', en: 'Parish', de: 'Gemeindebezirk', nl: 'Parochie', zh: '教区' },
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

export default function AgentPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [selected, setSelected] = useState<Property | null>(null)
  const [lang, setLang] = useState<Lang>('fr')
  const [langOpen, setLangOpen] = useState(false)
  const [valuationOpen, setValuationOpen] = useState(false)
  const [poweredBy, setPoweredBy] = useState('Powered by SAFTI')
  const [bioFr, setBioFr] = useState('')
  const [bioTranslations, setBioTranslations] = useState<Record<string, string>>({})

  const [filters, setFilters] = useState({
    district: '', concelho: '', freguesia: '',
    type: '', bedrooms: '', minArea: '', maxArea: '', minPrice: '', maxPrice: '',
  })

  useEffect(() => {
    const saved = localStorage.getItem('ep_lang') as Lang
    if (saved) setLang(saved)
    supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => setProperties((data || []) as Property[]))
    supabase
      .from('profiles')
      .select('powered_by, bio, bio_translations')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.powered_by) setPoweredBy(data.powered_by)
        if (data?.bio) setBioFr(data.bio)
        if (data?.bio_translations) setBioTranslations(data.bio_translations)
      })
  }, [])

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

  // Options depuis la base de données Portugal complète
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

  return (
    <main className="min-h-screen bg-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header orange */}
      <div className="bg-orange-500 text-white py-12 px-6 relative min-h-[220px]">
        {/* Sélecteur de langue */}
        <div className="absolute top-4 right-4">
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

        {/* Photo positionnée en absolu à gauche — carré fixe pour garder le cercle */}
        <div className="absolute left-12 top-4 bottom-4 hidden md:flex items-center">
          <img
            src={AGENT.photo}
            alt={AGENT.name}
            style={{width:'auto', height:'100%', aspectRatio:'1/1'}}
            className="rounded-full border-4 border-white object-cover object-top shadow-xl"
          />
        </div>

        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 md:pl-64">
          {/* Photo mobile uniquement */}
          <img
            src={AGENT.photo}
            alt={AGENT.name}
            className="w-44 h-44 rounded-full border-4 border-white object-cover object-top shadow-xl flex-shrink-0 md:hidden"
          />
          <div>
            <div className="inline-block mb-3">
              <h1 className="text-5xl font-bold">{AGENT.name}</h1>
              <p className="text-orange-200 text-xs font-medium text-right">{poweredBy}</p>
            </div>
            <p className="text-orange-100 mb-4 max-w-xl text-center whitespace-pre-line">
              {bioTranslations[lang] || (lang === 'fr' ? bioFr : null) || bioFr || t('bio', lang)}
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={`tel:${AGENT.phone}`} className="bg-white text-orange-500 font-semibold px-5 py-2 rounded-xl text-sm hover:bg-orange-50 transition-colors">
                📞 {AGENT.phone}
              </a>
              <a href={`https://wa.me/${AGENT.whatsapp}`} target="_blank" rel="noopener" className="bg-green-500 text-white font-semibold px-5 py-2 rounded-xl text-sm hover:bg-green-600 transition-colors">
                💬 WhatsApp
              </a>
              <a href={`mailto:${AGENT.email}`} className="bg-orange-400 text-white font-semibold px-5 py-2 rounded-xl text-sm hover:bg-orange-300 transition-colors">
                ✉️ Email
              </a>
              <button
                onClick={() => setValuationOpen(true)}
                className="bg-white/20 hover:bg-white/30 border-2 border-white text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
              >
                🏠 {t('valuation', lang)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {/* District */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('district', lang)}</label>
              <select className={inp} value={filters.district} onChange={e => { setFilter('district', e.target.value); setFilter('concelho', ''); setFilter('freguesia', '') }}>
                <option value="">—</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {/* Concelho */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('concelho', lang)}</label>
              <select className={inp} value={filters.concelho} onChange={e => { setFilter('concelho', e.target.value); setFilter('freguesia', '') }}>
                <option value="">—</option>
                {concelhos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {/* Freguesia */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('freguesia', lang)}</label>
              <select className={inp} value={filters.freguesia} onChange={e => setFilter('freguesia', e.target.value)}>
                <option value="">—</option>
                {freguesias.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            {/* Type */}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
            {/* Chambres */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('bedrooms', lang)}</label>
              <select className={inp} value={filters.bedrooms} onChange={e => setFilter('bedrooms', e.target.value)}>
                <option value="">{fl('allBeds', lang)}</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
            {/* Surface min */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('minArea', lang)}</label>
              <input className={inp} type="number" value={filters.minArea} onChange={e => setFilter('minArea', e.target.value)} placeholder="Ex: 100" />
            </div>
            {/* Surface max */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('maxArea', lang)}</label>
              <input className={inp} type="number" value={filters.maxArea} onChange={e => setFilter('maxArea', e.target.value)} placeholder="Ex: 500" />
            </div>
            {/* Prix min */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('minPrice', lang)}</label>
              <input className={inp} type="number" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} placeholder="Ex: 100000" />
            </div>
            {/* Prix max */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('maxPrice', lang)}</label>
              <input className={inp} type="number" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} placeholder="Ex: 500000" />
            </div>
            {/* Reset */}
            {hasFilters && (
              <div>
                <button onClick={resetFilters} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
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
          <a href={AGENT.safti_url} target="_blank" rel="noopener" className="text-sm text-orange-500 hover:underline font-medium">
            {t('seeOnSafti', lang)}
          </a>
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

      {/* Modal property */}
      {selected && <PropertyModal p={selected} lang={lang} onClose={() => setSelected(null)} />}

      {/* Modal évaluation */}
      {valuationOpen && <ValuationModal lang={lang} onClose={() => setValuationOpen(false)} />}
    </main>
  )
}
