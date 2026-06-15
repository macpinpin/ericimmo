'use client'

import { useState } from 'react'
import type { Property } from '@/lib/types'
import { t, type Lang } from '@/lib/translations'

function fmtPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
}

const TYPE_LABELS: Record<string, Record<string, string>> = {
  villa:      { fr:'Villa', pt:'Moradia', en:'Villa', es:'Villa', de:'Villa', zh:'别墅', it:'Villa', nl:'Villa', ru:'Вилла', ar:'فيلا' },
  apartment:  { fr:'Appartement', pt:'Apartamento', en:'Apartment', es:'Apartamento', de:'Wohnung', zh:'公寓', it:'Appartamento', nl:'Appartement', ru:'Квартира', ar:'شقة' },
  land:       { fr:'Terrain', pt:'Terreno', en:'Land', es:'Terreno', de:'Grundstück', zh:'土地', it:'Terreno', nl:'Grond', ru:'Участок', ar:'أرض' },
  commercial: { fr:'Commercial', pt:'Comercial', en:'Commercial', es:'Comercial', de:'Gewerbe', zh:'商业', it:'Commerciale', nl:'Commercieel', ru:'Коммерция', ar:'تجاري' },
  other:      { fr:'Autre', pt:'Outro', en:'Other', es:'Otro', de:'Sonstiges', zh:'其他', it:'Altro', nl:'Anders', ru:'Другое', ar:'أخرى' },
}

export function PropertyCard({ p, lang, onOpen }: { p: Property; lang: Lang; onOpen: () => void }) {
  const [imgIdx, setImgIdx] = useState(0)

  function prev(e: React.MouseEvent) {
    e.stopPropagation()
    setImgIdx(i => (i - 1 + p.images.length) % p.images.length)
  }
  function next(e: React.MouseEvent) {
    e.stopPropagation()
    setImgIdx(i => (i + 1) % p.images.length)
  }

  return (
    <div onClick={onOpen} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group">
      <div className="relative aspect-video bg-gray-100">
        {p.images?.[imgIdx] ? (
          <img src={p.images[imgIdx]} alt={p.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🏠</div>
        )}

        {p.images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-lg">‹</button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-lg">›</button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {p.images.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
              ))}
            </div>
          </>
        )}

        <div className="absolute top-3 left-3 flex gap-1">
          {p.matterport_url && (
            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-lg font-medium">🥽 360°</span>
          )}
          {p.video_url && (
            <span className="bg-black/70 text-white text-xs px-2 py-1 rounded-lg font-medium">▶ Vidéo</span>
          )}
        </div>
        <span className={`absolute top-3 right-3 text-xs px-2 py-1 rounded-lg font-medium ${
          p.type === 'villa' ? 'bg-orange-100 text-orange-700' :
          p.type === 'apartment' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
        }`}>{TYPE_LABELS[p.type]?.[lang] || p.type}</span>
      </div>

      <div className="p-5">
        <p className="font-bold text-orange-500 text-xl mb-1">{fmtPrice(p.price)}</p>
        <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
          {p.translations?.title?.[lang] || p.title}
        </h3>
        <p className="text-xs text-gray-400 mb-3">📍 {p.location}</p>
        <div className="flex gap-3 text-xs text-gray-500">
          {p.bedrooms && <span>🛏 {p.bedrooms} {t('rooms', lang)}</span>}
          {p.bathrooms && <span>🚿 {p.bathrooms} {t('baths', lang)}</span>}
          {(p.area_bruta_privativa || p.area_utile) && <span>📐 {p.area_bruta_privativa || p.area_utile} m²</span>}
        </div>
      </div>
    </div>
  )
}

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

export function PropertyModal({ p, lang, onClose, fromDirectLink }: { p: Property; lang: Lang; onClose: () => void; fromDirectLink?: boolean }) {
  const [imgIdx, setImgIdx] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [showVtour, setShowVtour] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const AGENT_EMAIL = 'macpinpin@me.com'
  const youtubeId = p.video_url ? getYoutubeId(p.video_url) : null
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/agents/eric-perniaux?bien=${p.id}` : ''
  const shareText = encodeURIComponent(`${p.title} - ${shareUrl}`)

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Galerie, vidéo ou visite virtuelle */}
        <div className="relative aspect-video bg-black rounded-t-2xl overflow-hidden">
          {showVtour && p.matterport_url ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={p.matterport_url}
              allow="fullscreen; vr"
              allowFullScreen
            />
          ) : showVideo && youtubeId ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            <>
              {p.images?.[imgIdx] ? (
                <img src={p.images[imgIdx]} alt={p.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-5xl">🏠</div>
              )}
              {p.images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + p.images.length) % p.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-black/70">‹</button>
                  <button onClick={() => setImgIdx(i => (i + 1) % p.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-black/70">›</button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {p.images.map((_, i) => (
                      <button key={i} onClick={() => setImgIdx(i)} className={`w-2 h-2 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          <button onClick={onClose} className="absolute top-3 left-3 bg-black/50 text-white h-8 px-3 rounded-full flex items-center gap-1.5 hover:bg-black/70 z-10 text-sm font-medium">
            ← {fromDirectLink ? 'Tous les biens' : ''}
          </button>
          <button onClick={onClose} className="absolute top-3 right-3 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/70 z-10">✕</button>
        </div>

        {/* Boutons juste sous les photos */}
        <div className="flex gap-2 px-6 py-4 border-b border-gray-100">
          {p.matterport_url && (
            <button
              onClick={() => { setShowVtour(v => !v); setShowVideo(false) }}
              className={`flex-1 text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${showVtour ? 'bg-gray-600 text-white' : 'bg-gray-900 text-white hover:bg-gray-700'}`}
            >
              {showVtour ? '📸 Photos' : t('vtour', lang)}
            </button>
          )}
          {youtubeId && (
            <button
              onClick={() => { setShowVideo(v => !v); setShowVtour(false) }}
              className={`flex-1 text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${showVideo ? 'bg-red-600 text-white' : 'bg-red-500 text-white hover:bg-red-600'}`}
            >
              {showVideo ? '📸 Photos' : '▶ Vidéo'}
            </button>
          )}
          <div className="relative flex-1">
            <button
              onClick={() => setShowShare(v => !v)}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-colors bg-blue-500 hover:bg-blue-600 text-white"
            >
              🔗 Partager
            </button>
            {showShare && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-20">
                <p className="text-xs text-gray-400 font-medium px-4 pt-3 pb-2 uppercase tracking-wide">Partager ce bien</p>
                <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <span className="text-xl">📱</span> WhatsApp
                </a>
                <a href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=966242223397117`} target="_blank" rel="noopener"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <span className="text-xl">💬</span> Messenger
                </a>
                <a href={`mailto:?subject=${encodeURIComponent(p.title)}&body=${shareText}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <span className="text-xl">✉️</span> Email
                </a>
                <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(p.title)}`} target="_blank" rel="noopener"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <span className="text-xl">✈️</span> Telegram
                </a>
                <button onClick={copyLink}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 w-full border-t border-gray-100">
                  <span className="text-xl">{copied ? '✅' : '📋'}</span>
                  {copied ? 'Lien copié !' : 'Copier le lien'}
                </button>
              </div>
            )}
          </div>
          <a href={`mailto:${AGENT_EMAIL}?subject=${p.title}`}
            className="flex-1 text-center bg-orange-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-600 transition-colors">
            {t('contact', lang)}
          </a>
          <a href={`https://wa.me/351961571482?text=${encodeURIComponent(p.title + ' ' + window.location.origin + '/agents/eric-perniaux?bien=' + p.id)}`} target="_blank" rel="noopener"
            className="flex-1 text-center bg-green-500 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-600 transition-colors">
            💬 WhatsApp
          </a>
        </div>

        {/* Infos */}
        <div className="p-6">
          {p.ref && <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Réf. {p.ref}</p>}
          <p className="text-3xl font-bold text-orange-500 mb-2">{fmtPrice(p.price)}</p>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{p.translations?.title?.[lang] || p.title}</h2>
          <p className="text-gray-400 mb-5">📍 {p.location}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 rounded-xl p-4 mb-5">
            {p.area_bruta_privativa && <div className="text-center"><p className="font-bold text-gray-900">{p.area_bruta_privativa}</p><p className="text-xs text-gray-400">{t('areaBrutaPrivativa', lang)}</p></div>}
            {p.area_bruta_dependente && <div className="text-center"><p className="font-bold text-gray-900">{p.area_bruta_dependente}</p><p className="text-xs text-gray-400">{t('areaBrutaDependente', lang)}</p></div>}
            {p.area_utile && <div className="text-center"><p className="font-bold text-gray-900">{p.area_utile}</p><p className="text-xs text-gray-400">{t('areaUtile', lang)}</p></div>}
            {p.plot && <div className="text-center"><p className="font-bold text-gray-900">{p.plot.toLocaleString()}</p><p className="text-xs text-gray-400">{t('land', lang)}</p></div>}
            {p.bedrooms && <div className="text-center"><p className="font-bold text-gray-900">{p.bedrooms}</p><p className="text-xs text-gray-400">{t('rooms', lang)}</p></div>}
            {p.bathrooms && <div className="text-center"><p className="font-bold text-gray-900">{p.bathrooms}</p><p className="text-xs text-gray-400">{t('baths', lang)}</p></div>}
          </div>

          {(p.translations?.description?.[lang] || p.description) && (
            <div>
              {(p.translations?.description?.[lang] || p.description)!.split('\n\n').map((para, i) => (
                <p key={i} className="text-gray-600 text-sm leading-relaxed mb-3">{para}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
