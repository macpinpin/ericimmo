'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Property, Agent } from '@/lib/types'
import { PropertyCard, PropertyModal } from '@/components/PropertyCard'
import { LANGS, type Lang } from '@/lib/translations'
import { getDistricts, getConcelhos, getFreguesias } from '@/lib/portugal'

type AgentContact = { email: string; phone: string; whatsapp: string; slug: string }

const FILTER_LABELS: Record<string, Record<string, string>> = {
  district: { fr: 'District', pt: 'Distrito', en: 'District', de: 'Bezirk', nl: 'District', zh: '地区' },
  concelho: { fr: 'Concelho', pt: 'Concelho', en: 'Municipality', de: 'Gemeinde', nl: 'Gemeente', zh: '市镇' },
  type: { fr: 'Type de bien', pt: 'Tipo de imóvel', en: 'Property type', de: 'Immobilientyp', nl: 'Type woning', zh: '房产类型' },
  bedrooms: { fr: 'Chambres min.', pt: 'Quartos mín.', en: 'Min. bedrooms', de: 'Mind. Zimmer', nl: 'Min. slaapk.', zh: '最少卧室' },
  minPrice: { fr: 'Prix min. (€)', pt: 'Preço mín. (€)', en: 'Min. price (€)', de: 'Min. Preis (€)', nl: 'Min. prijs (€)', zh: '最低价格 (€)' },
  maxPrice: { fr: 'Prix max. (€)', pt: 'Preço máx. (€)', en: 'Max. price (€)', de: 'Max. Preis (€)', nl: 'Max. prijs (€)', zh: '最高价格 (€)' },
  reset: { fr: 'Réinitialiser', pt: 'Reiniciar', en: 'Reset', de: 'Zurücksetzen', nl: 'Resetten', zh: '重置' },
  allTypes: { fr: 'Tous les types', pt: 'Todos os tipos', en: 'All types', de: 'Alle Typen', nl: 'Alle types', zh: '所有类型' },
  allBeds: { fr: 'Peu importe', pt: 'Qualquer', en: 'Any', de: 'Egal', nl: 'Maakt niet uit', zh: '不限' },
  noResult: { fr: 'Aucun bien ne correspond à vos critères.', pt: 'Nenhum imóvel corresponde.', en: 'No properties match.', de: 'Keine Treffer.', nl: 'Geen resultaten.', zh: '无匹配房产。' },
  properties: { fr: 'biens disponibles', pt: 'imóveis disponíveis', en: 'properties available', de: 'Immobilien verfügbar', nl: 'woningen beschikbaar', zh: '套房产' },
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
    type: '', bedrooms: '', minPrice: '', maxPrice: '',
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
    setFilters({ district: '', concelho: '', freguesia: '', type: '', bedrooms: '', minPrice: '', maxPrice: '' })
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
    if (filters.minPrice && p.price < parseFloat(filters.minPrice)) return false
    if (filters.maxPrice && p.price > parseFloat(filters.maxPrice)) return false
    return true
  }), [properties, filters])

  const hasFilters = Object.values(filters).some(v => v !== '')
  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0]
  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 transition-colors bg-white"

  function getAgentContact(agentId: string): AgentContact {
    const a = agents.get(agentId)
    return {
      email: a?.contact_email || a?.email || '',
      phone: a?.phone || '',
      whatsapp: a?.whatsapp || '',
      slug: a?.slug || '',
    }
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-orange-500 text-white px-6 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🏠 Habiteo</h1>
            <p className="text-white/70 text-sm mt-1">Tous les biens disponibles</p>
          </div>

          {/* Sélecteur langue */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(o => !o)}
              className="bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
            >
              <span>{currentLang.flag}</span>
              <span className="hidden sm:inline">{currentLang.label}</span>
              <span className="text-xs">▾</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 grid grid-cols-2 w-44">
                {LANGS.map(l => (
                  <button key={l.code} onClick={() => switchLang(l.code)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm hover:bg-orange-50 transition-colors ${lang === l.code ? 'text-orange-500 font-semibold' : 'text-gray-700'}`}>
                    <span>{l.flag}</span><span>{l.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-5">
        <div className="max-w-6xl mx-auto">
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
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('bedrooms', lang)}</label>
              <select className={inp} value={filters.bedrooms} onChange={e => setFilter('bedrooms', e.target.value)}>
                <option value="">{fl('allBeds', lang)}</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('minPrice', lang)}</label>
              <input className={inp} type="number" value={filters.minPrice} onChange={e => setFilter('minPrice', e.target.value)} placeholder="Ex: 100 000" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">{fl('maxPrice', lang)}</label>
              <input className={inp} type="number" value={filters.maxPrice} onChange={e => setFilter('maxPrice', e.target.value)} placeholder="Ex: 500 000" />
            </div>
            {hasFilters && (
              <button onClick={resetFilters} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
                ✕ {fl('reset', lang)}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Biens */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Chargement...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                <span className="text-orange-500">{filtered.length}</span> {fl('properties', lang)}
                {hasFilters && properties.filter(p => !p.is_offmarket).length !== filtered.length && (
                  <span className="text-gray-400 font-normal text-base"> / {properties.filter(p => !p.is_offmarket).length}</span>
                )}
              </h2>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">🔍</p>
                <p>{fl('noResult', lang)}</p>
                {hasFilters && (
                  <button onClick={resetFilters} className="mt-4 text-orange-500 hover:underline text-sm font-medium">
                    {fl('reset', lang)}
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(p => (
                  <div key={p.id} className="relative">
                    {/* Badge agent */}
                    {agents.get(p.agent_id) && (
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-sm">
                        {agents.get(p.agent_id)?.photo_url && (
                          <img src={agents.get(p.agent_id)!.photo_url!} alt="" className="w-5 h-5 rounded-full object-cover" />
                        )}
                        <span className="text-xs font-semibold text-gray-700">{agents.get(p.agent_id)?.name}</span>
                      </div>
                    )}
                    <PropertyCard p={p} lang={lang} onOpen={() => setSelected(p)} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

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
