'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Property, Agent } from '@/lib/types'
import { PropertyCard, PropertyModal, type AgentContact } from '@/components/PropertyCard'
import { LANGS, type Lang } from '@/lib/translations'
import { getDistricts, getConcelhos, getFreguesias } from '@/lib/portugal'

const FILTER_LABELS: Record<string, Record<string, string>> = {
  district:  { fr: 'Province',       pt: 'Distrito',      en: 'District',       de: 'Bezirk',        nl: 'District',   zh: '地区' },
  concelho:  { fr: 'Commune',        pt: 'Concelho',      en: 'Municipality',   de: 'Gemeinde',      nl: 'Gemeente',   zh: '市镇' },
  freguesia: { fr: 'Village',        pt: 'Freguesia',     en: 'Parish',         de: 'Gemeindebezirk',nl: 'Parochie',   zh: '教区' },
  type:      { fr: 'Type de bien',   pt: 'Tipo de imóvel',en: 'Property type',  de: 'Immobilientyp', nl: 'Type woning',zh: '房产类型' },
  bedrooms:  { fr: 'Chambres min.',  pt: 'Quartos mín.',  en: 'Min. bedrooms',  de: 'Mind. Zimmer',  nl: 'Min. slaapk.',zh: '最少卧室' },
  minArea:   { fr: 'Surface min. (m²)', pt: 'Área mín. (m²)', en: 'Min. area (m²)', de: 'Mind. Fläche (m²)', nl: 'Min. opp. (m²)', zh: '最小面积 (m²)' },
  maxArea:   { fr: 'Surface max. (m²)', pt: 'Área máx. (m²)', en: 'Max. area (m²)', de: 'Max. Fläche (m²)', nl: 'Max. opp. (m²)', zh: '最大面积 (m²)' },
  minPrice:  { fr: 'Prix min. (€)',  pt: 'Preço mín. (€)',en: 'Min. price (€)', de: 'Min. Preis (€)', nl: 'Min. prijs (€)', zh: '最低价格 (€)' },
  maxPrice:  { fr: 'Prix max. (€)',  pt: 'Preço máx. (€)',en: 'Max. price (€)', de: 'Max. Preis (€)', nl: 'Max. prijs (€)', zh: '最高价格 (€)' },
  reset:     { fr: 'Réinitialiser', pt: 'Reiniciar',     en: 'Reset',          de: 'Zurücksetzen',  nl: 'Resetten',   zh: '重置' },
  allTypes:  { fr: 'Tous les types', pt: 'Todos os tipos',en: 'All types',      de: 'Alle Typen',    nl: 'Alle types', zh: '所有类型' },
  allBeds:   { fr: 'Peu importe',    pt: 'Qualquer',      en: 'Any',            de: 'Egal',          nl: 'Maakt niet uit', zh: '不限' },
  noResult:  { fr: 'Aucun bien ne correspond à vos critères.', pt: 'Nenhum imóvel corresponde.', en: 'No properties match.', de: 'Keine Treffer.', nl: 'Geen resultaten.', zh: '无匹配房产。' },
  properties:{ fr: 'biens disponibles', pt: 'imóveis disponíveis', en: 'properties available', de: 'Immobilien verfügbar', nl: 'woningen beschikbaar', zh: '套房产' },
  subtitle:  { fr: 'Algarve · Portugal', pt: 'Algarve · Portugal', en: 'Algarve · Portugal', de: 'Algarve · Portugal', nl: 'Algarve · Portugal', zh: 'Algarve · Portugal' },
  villa:     { fr: 'Villa / Maison', pt: 'Moradia / Casa', en: 'Villa / House', de: 'Villa / Haus', nl: 'Villa / Huis', zh: '别墅 / 房子' },
  apartment: { fr: 'Appartement',   pt: 'Apartamento',   en: 'Apartment',      de: 'Wohnung',       nl: 'Appartement',zh: '公寓' },
  land:      { fr: 'Terrain',       pt: 'Terreno',       en: 'Land',           de: 'Grundstück',    nl: 'Grond',      zh: '土地' },
  commercial:{ fr: 'Commercial',    pt: 'Comercial',     en: 'Commercial',     de: 'Gewerbe',       nl: 'Commercieel',zh: '商业' },
  other:     { fr: 'Autre',         pt: 'Outro',         en: 'Other',          de: 'Andere',        nl: 'Andere',     zh: '其他' },
}

function fl(key: string, lang: string) {
  return FILTER_LABELS[key]?.[lang] || FILTER_LABELS[key]?.['fr'] || key
}

export default function BiensPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [agents, setAgents] = useState<Map<string, Agent>>(new Map())
  const [selected, setSelected] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<Lang>('fr')
  const [langOpen, setLangOpen] = useState(false)

  const [filters, setFilters] = useState({
    district: '', concelho: '', freguesia: '',
    type: '', bedrooms: '', minArea: '', maxArea: '', minPrice: '', maxPrice: '',
  })

  useEffect(() => {
    const saved = localStorage.getItem('ep_lang') as Lang
    if (saved) setLang(saved)

    Promise.all([
      supabase.from('properties').select('*').eq('status', 'active').order('created_at', { ascending: false }),
      supabase.from('agents').select('*'),
    ]).then(([{ data: props }, { data: agts }]) => {
      setProperties((props || []) as Property[])
      const map = new Map<string, Agent>()
      for (const a of (agts || []) as Agent[]) map.set(a.id, a)
      setAgents(map)
      setLoading(false)
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

  const districts = useMemo(() => getDistricts(), [])
  const concelhos = useMemo(() => getConcelhos(filters.district), [filters.district])
  const freguesias = useMemo(() => getFreguesias(filters.district, filters.concelho), [filters.district, filters.concelho])

  const filtered = useMemo(() => properties.filter(p => {
    if (p.is_offmarket) return false
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

  const inp = "w-full bg-white border border-gray-200 px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-orange-400 transition-colors"

  function getAgentContact(agentId: string): AgentContact {
    const a = agents.get(agentId)
    return {
      email: a?.contact_email || a?.email || '',
      phone: a?.phone || '',
      whatsapp: a?.whatsapp || '',
      slug: a?.slug || '',
      name: a?.name || '',
      photo: a?.photo_url || '',
    }
  }

  return (
    <main className="min-h-screen bg-white">

      {/* Header */}
      <header className="bg-gray-900 px-8 py-10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex flex-col items-start">
            <svg width="160" height="130" viewBox="0 0 300 240" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M 93.4 108.4 A 80 80 0 0 1 206.6 108.4" stroke="#777777" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M 111.8 126.8 A 54 54 0 0 1 188.2 126.8" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round"/>
              <path d="M 130.2 145.2 A 28 28 0 0 1 169.8 145.2" stroke="#F97316" strokeWidth="4" strokeLinecap="round"/>
              <circle cx="150" cy="165" r="13" stroke="#FFFFFF" strokeWidth="2.5"/>
              <circle cx="150" cy="165" r="5" fill="#F97316"/>
              <text x="150" y="210" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="26" letterSpacing="0.5">
                <tspan fontWeight="700" fill="#F97316">e</tspan>
                <tspan fontWeight="200" fill="#FFFFFF">-nestwork</tspan>
              </text>
            </svg>
            <div className="text-[10px] tracking-[0.2em] text-orange-500 mt-1 uppercase">
              {!loading && (
                <><span className="text-orange-400 font-medium">{filtered.length}</span> {fl('properties', lang)}</>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard"
              className="text-[11px] tracking-widest text-gray-400 hover:text-white transition-colors uppercase border border-gray-700 hover:border-gray-400 px-4 py-2">
              Espace agent
            </a>
            <div className="relative">
              <button onClick={() => setLangOpen(o => !o)}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors border border-gray-700 hover:border-gray-400 px-3 py-2">
                <span>{currentLang.flag}</span>
                <span className="text-[11px] tracking-widest uppercase hidden sm:inline">{currentLang.label}</span>
                <span className="text-[10px] text-gray-500">▾</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-100 shadow-xl z-50 grid grid-cols-2 w-44">
                  {LANGS.map(l => (
                    <button key={l.code} onClick={() => switchLang(l.code)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${lang === l.code ? 'text-orange-500 font-medium' : 'text-gray-600'}`}>
                      <span>{l.flag}</span><span className="text-xs">{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Filtres */}
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-[10px] tracking-widest text-gray-400 uppercase mb-1.5">{fl('type', lang)}</label>
              <select className={inp} value={filters.type} onChange={e => setFilter('type', e.target.value)}>
                <option value="">{fl('allTypes', lang)}</option>
                <option value="villa">{fl('villa', lang)}</option>
                <option value="apartment">{fl('apartment', lang)}</option>
                <option value="land">{fl('land', lang)}</option>
                <option value="commercial">{fl('commercial', lang)}</option>
                <option value="other">{fl('other', lang)}</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] tracking-widest text-gray-400 uppercase mb-1.5">{fl('district', lang)}</label>
              <select className={inp} value={filters.district} onChange={e => { setFilter('district', e.target.value); setFilter('concelho', ''); setFilter('freguesia', '') }}>
                <option value="">—</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] tracking-widest text-gray-400 uppercase mb-1.5">{fl('concelho', lang)}</label>
              <select className={inp} value={filters.concelho} onChange={e => { setFilter('concelho', e.target.value); setFilter('freguesia', '') }}>
                <option value="">—</option>
                {concelhos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] tracking-widest text-gray-400 uppercase mb-1.5">{fl('freguesia', lang)}</label>
              <select className={inp} value={filters.freguesia} onChange={e => setFilter('freguesia', e.target.value)}>
                <option value="">—</option>
                {freguesias.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[100px]">
              <label className="block text-[10px] tracking-widest text-gray-400 uppercase mb-1.5">{fl('bedrooms', lang)}</label>
              <select className={inp} value={filters.bedrooms} onChange={e => setFilter('bedrooms', e.target.value)}>
                <option value="">{fl('allBeds', lang)}</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[110px]">
              <label className="block text-[10px] tracking-widest text-gray-400 uppercase mb-1.5">{fl('minArea', lang)}</label>
              <input className={inp} type="number" value={filters.minArea} onChange={e => setFilter('minArea', e.target.value)} placeholder="Ex: 100" />
            </div>
            <div className="flex-1 min-w-[110px]">
              <label className="block text-[10px] tracking-widest text-gray-400 uppercase mb-1.5">{fl('maxArea', lang)}</label>
              <input className={inp} type="number" value={filters.maxArea} onChange={e => setFilter('maxArea', e.target.value)} placeholder="Ex: 500" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-[10px] tracking-widest text-gray-400 uppercase mb-1.5">{fl('minPrice', lang)}</label>
              <input className={inp} type="number" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} placeholder="Ex: 100 000" />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-[10px] tracking-widest text-gray-400 uppercase mb-1.5">{fl('maxPrice', lang)}</label>
              <input className={inp} type="number" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} placeholder="Ex: 500 000" />
            </div>
            {hasFilters && (
              <button onClick={resetFilters}
                className="border border-orange-400 text-orange-500 hover:bg-orange-500 hover:text-white text-[11px] tracking-widest uppercase px-5 py-2.5 transition-colors whitespace-nowrap">
                ✕ {fl('reset', lang)}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grille */}
      <div className="bg-white px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center py-24 text-gray-300">
              <div className="w-8 h-8 border border-orange-300 border-t-orange-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs tracking-widest uppercase text-gray-300">Chargement</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xs tracking-widest uppercase text-gray-300 mb-3">Aucun résultat</p>
              <p className="text-sm text-gray-400">{fl('noResult', lang)}</p>
              {hasFilters && (
                <button onClick={resetFilters} className="mt-6 text-[11px] tracking-widest uppercase text-orange-500 hover:underline">
                  {fl('reset', lang)}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map(p => (
                <PropertyCard key={p.id} p={p} lang={lang} onOpen={() => setSelected(p)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center">
        <div className="text-[10px] tracking-[0.2em] text-gray-300 uppercase">
          Habiteo · Algarve Portugal · e-mo-tec.com
        </div>
      </footer>

      {selected && (
        <PropertyModal
          p={selected}
          lang={lang}
          fromDirectLink={false}
          agent={getAgentContact(selected.agent_id)}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  )
}
