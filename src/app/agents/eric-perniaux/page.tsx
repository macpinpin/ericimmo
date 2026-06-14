'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Property } from '@/lib/types'
import { PropertyCard, PropertyModal } from './PropertyCard'
import { LANGS, t, type Lang } from '@/lib/translations'
import ValuationModal from './ValuationModal'

const AGENT = {
  name: 'Eric Perniaux',
  phone: '+351 961 571 482',
  whatsapp: '351961571482',
  email: 'macpinpin@me.com',
  photo: '/agent.jpg',
  safti_url: 'https://www.safti.pt/consultor/eric-perniaux/33880427',
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

  const currentLang = LANGS.find(l => l.code === lang) || LANGS[0]

  return (
    <main className="min-h-screen bg-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header orange */}
      <div className="bg-orange-500 text-white py-12 px-6 relative">
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

        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8">
          <img
            src={AGENT.photo}
            alt={AGENT.name}
            className="w-44 h-44 rounded-full border-4 border-white object-cover object-top shadow-xl flex-shrink-0"
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

      {/* Biens */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {t('myProperties', lang)} <span className="text-orange-500">({properties.length})</span>
          </h2>
          <a href={AGENT.safti_url} target="_blank" rel="noopener" className="text-sm text-orange-500 hover:underline font-medium">
            {t('seeOnSafti', lang)}
          </a>
        </div>

        {properties.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🏡</p>
            <p>{t('noBiens', lang)}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map(p => (
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
