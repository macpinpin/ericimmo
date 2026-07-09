'use client'

import { useState, useEffect, useRef } from 'react'
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
    <div onClick={onOpen} className="bg-white border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer group">

      {/* Photo */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden"
        onTouchStart={e => {
          ;(e.currentTarget as any)._touchX = e.touches[0].clientX
          ;(e.currentTarget as any)._touchY = e.touches[0].clientY
        }}
        onTouchEnd={e => {
          const startX = (e.currentTarget as any)._touchX
          const startY = (e.currentTarget as any)._touchY
          if (startX === undefined) return
          const dx = startX - e.changedTouches[0].clientX
          const dy = startY - e.changedTouches[0].clientY
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40 && p.images.length > 1) {
            e.stopPropagation()
            if (dx > 0) setImgIdx(i => (i + 1) % p.images.length)
            else setImgIdx(i => (i - 1 + p.images.length) % p.images.length)
          }
        }}
      >
        {p.images?.[imgIdx] ? (
          <img src={p.images[imgIdx]} alt={p.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-200 text-4xl bg-gray-50">○</div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Prix sur la photo */}
        <div className="absolute bottom-3 left-3">
          <span className="text-white font-semibold text-lg tracking-tight drop-shadow-sm">{fmtPrice(p.price)}</span>
        </div>

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-orange-500 text-white text-[10px] tracking-widest uppercase px-2.5 py-1">
            {TYPE_LABELS[p.type]?.[lang] || p.type}
          </span>
        </div>

        {/* Badges 360 / Vidéo */}
        <div className="absolute top-3 right-3 flex gap-1">
          {p.matterport_url && (
            <span className="bg-black/60 text-white text-[10px] px-2 py-1 tracking-wide backdrop-blur-sm">360°</span>
          )}
          {p.video_url && (
            <span className="bg-black/60 text-white text-[10px] px-2 py-1 tracking-wide backdrop-blur-sm">▶</span>
          )}
        </div>

        {/* Navigation flèches */}
        {p.images.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-lg backdrop-blur-sm">‹</button>
            <button onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-lg backdrop-blur-sm">›</button>
            <div className="absolute bottom-3 right-3 flex gap-1">
              {p.images.map((_, i) => (
                <span key={i} className={`w-1 h-1 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Infos */}
      <div className="p-4">
        <h3 className="font-medium text-gray-900 text-sm leading-tight mb-1 line-clamp-1">
          {p.translations?.title?.[lang] || p.title}
        </h3>
        <p className="text-xs text-gray-400 mb-3">{p.location}</p>
        <div className="flex gap-4 text-xs text-gray-400 border-t border-gray-50 pt-3">
          {p.bedrooms && (
            <span className="flex flex-col items-center">
              <span className="text-gray-800 font-medium">{p.bedrooms}</span>
              <span className="text-[10px] tracking-wide">{t('rooms', lang)}</span>
            </span>
          )}
          {p.bathrooms && (
            <span className="flex flex-col items-center">
              <span className="text-gray-800 font-medium">{p.bathrooms}</span>
              <span className="text-[10px] tracking-wide">{t('baths', lang)}</span>
            </span>
          )}
          {(p.area_bruta_privativa || p.area_utile) && (
            <span className="flex flex-col items-center">
              <span className="text-gray-800 font-medium">{p.area_bruta_privativa || p.area_utile}</span>
              <span className="text-[10px] tracking-wide">m²</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

function FullscreenGallery({ images, startIdx, onClose }: { images: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx)
  const touchX = useRef<number | null>(null)
  const touchY = useRef<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.requestFullscreen?.().catch(() => {})
    return () => { if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {}) }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIdx(i => (i + 1) % images.length)
      if (e.key === 'ArrowLeft') setIdx(i => (i - 1 + images.length) % images.length)
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  return (
    <div ref={ref} className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      style={{ touchAction: 'none' }}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; touchY.current = e.touches[0].clientY }}
      onTouchEnd={e => {
        if (touchX.current === null || touchY.current === null) return
        const dx = touchX.current - e.changedTouches[0].clientX
        const dy = touchY.current - e.changedTouches[0].clientY
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
          if (dx > 0) setIdx(i => (i + 1) % images.length)
          else setIdx(i => (i - 1 + images.length) % images.length)
        } else if (Math.abs(dy) > 80 && Math.abs(dy) > Math.abs(dx)) {
          onClose()
        }
        touchX.current = null; touchY.current = null
      }}
    >
      <img src={images[idx]} alt="" className="max-w-full max-h-full object-contain select-none" draggable={false} />

      <button onClick={onClose}
        className="absolute top-4 right-4 bg-white/10 text-white w-10 h-10 flex items-center justify-center text-xl hover:bg-white/20 transition-colors">✕</button>

      {images.length > 1 && (
        <>
          <button onClick={() => setIdx(i => (i - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/10 text-white w-11 h-11 flex items-center justify-center text-2xl hover:bg-white/20 transition-colors">‹</button>
          <button onClick={() => setIdx(i => (i + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/10 text-white w-11 h-11 flex items-center justify-center text-2xl hover:bg-white/20 transition-colors">›</button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
          <div className="absolute bottom-5 right-5 text-white/40 text-sm">{idx + 1} / {images.length}</div>
        </>
      )}
    </div>
  )
}

export type AgentContact = {
  email: string
  phone: string
  whatsapp: string
  slug: string
  name?: string
  photo?: string
}

export function PropertyModal({
  p, lang, onClose, fromDirectLink, agent
}: {
  p: Property
  lang: Lang
  onClose: () => void
  fromDirectLink?: boolean
  agent: AgentContact
}) {
  const [imgIdx, setImgIdx] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [showVtour, setShowVtour] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [contactSending, setContactSending] = useState(false)
  const [contactSent, setContactSent] = useState(false)
  const youtubeId = p.video_url ? getYoutubeId(p.video_url) : null
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/agents/${agent.slug}?bien=${p.id}` : ''
  const shareText = encodeURIComponent(`${p.title} - ${shareUrl}`)

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
  }

  return (
    <>
    {fullscreen && p.images.length > 0 && (
      <FullscreenGallery images={p.images} startIdx={imgIdx} onClose={() => setFullscreen(false)} />
    )}
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Photo principale */}
        <div className="relative aspect-video bg-black overflow-hidden"
          onTouchStart={e => {
            ;(e.currentTarget as any)._touchX = e.touches[0].clientX
            ;(e.currentTarget as any)._touchY = e.touches[0].clientY
          }}
          onTouchEnd={e => {
            const startX = (e.currentTarget as any)._touchX
            const startY = (e.currentTarget as any)._touchY
            if (startX === undefined) return
            const dx = startX - e.changedTouches[0].clientX
            const dy = startY - e.changedTouches[0].clientY
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40 && p.images.length > 1) {
              if (dx > 0) setImgIdx(i => (i + 1) % p.images.length)
              else setImgIdx(i => (i - 1 + p.images.length) % p.images.length)
            }
          }}
        >
          {showVtour && p.matterport_url ? (
            <iframe className="absolute inset-0 w-full h-full" src={p.matterport_url} allow="fullscreen; vr" allowFullScreen />
          ) : showVideo && youtubeId ? (
            <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`} allow="autoplay; fullscreen" allowFullScreen />
          ) : (
            <>
              {p.images?.[imgIdx] ? (
                <img src={p.images[imgIdx]} alt={p.title}
                  className="absolute inset-0 w-full h-full object-cover cursor-zoom-in"
                  onClick={() => setFullscreen(true)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200 text-5xl">○</div>
              )}
              {p.images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx(i => (i - 1 + p.images.length) % p.images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 text-white w-10 h-10 flex items-center justify-center text-xl hover:bg-black/60 transition-colors backdrop-blur-sm">‹</button>
                  <button onClick={() => setImgIdx(i => (i + 1) % p.images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 text-white w-10 h-10 flex items-center justify-center text-xl hover:bg-black/60 transition-colors backdrop-blur-sm">›</button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {p.images.map((_, i) => (
                      <button key={i} onClick={() => setImgIdx(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          <button onClick={onClose}
            className="absolute top-3 left-3 bg-black/40 text-white h-8 px-3 flex items-center gap-1.5 hover:bg-black/60 z-10 text-sm backdrop-blur-sm transition-colors">
            ← {fromDirectLink ? 'Tous les biens' : ''}
          </button>
          <button onClick={onClose}
            className="absolute top-3 right-3 bg-black/40 text-white w-8 h-8 flex items-center justify-center hover:bg-black/60 z-10 backdrop-blur-sm transition-colors">✕</button>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2 px-5 py-4 border-b border-gray-100">
          {p.matterport_url && (
            <button
              onClick={() => { setShowVtour(v => !v); setShowVideo(false) }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs tracking-widest uppercase font-medium rounded-xl transition-colors ${showVtour ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" /></svg>
              <span>{showVtour ? 'Photos' : '360°'}</span>
            </button>
          )}
          {youtubeId && (
            <button
              onClick={() => { setShowVideo(v => !v); setShowVtour(false) }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs tracking-widest uppercase font-medium rounded-xl transition-colors ${showVideo ? 'bg-red-700 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}>
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              <span>{showVideo ? 'Photos' : 'Vidéo'}</span>
            </button>
          )}
          <div className="relative flex-1">
            <button
              onClick={() => setShowShare(v => !v)}
              className="w-full h-full flex items-center justify-center gap-1.5 py-2.5 text-xs tracking-widest uppercase font-medium rounded-xl border border-gray-200 text-gray-500 hover:border-gray-800 hover:text-gray-800 transition-colors">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              <span>Partager</span>
            </button>
            {showShare && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-white shadow-2xl border border-gray-100 rounded-xl overflow-hidden z-20">
                <p className="text-[10px] text-gray-400 tracking-widest uppercase px-4 pt-3 pb-2">Partager ce bien</p>
                <a href={`https://wa.me/?text=${shareText}`} target="_blank" rel="noopener"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm text-gray-700">
                  <span className="text-lg">📱</span> WhatsApp
                </a>
                <a href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(shareUrl)}&app_id=966242223397117`} target="_blank" rel="noopener"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm text-gray-700">
                  <span className="text-lg">💬</span> Messenger
                </a>
                <a href={`mailto:?subject=${encodeURIComponent(p.title)}&body=${shareText}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm text-gray-700">
                  <span className="text-lg">✉️</span> Email
                </a>
                <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(p.title)}`} target="_blank" rel="noopener"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm text-gray-700">
                  <span className="text-lg">✈️</span> Telegram
                </a>
                <button onClick={copyLink}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-sm text-gray-700 w-full border-t border-gray-100">
                  <span className="text-lg">{copied ? '✅' : '📋'}</span>
                  {copied ? 'Lien copié !' : 'Copier le lien'}
                </button>
              </div>
            )}
          </div>
          <button onClick={() => { setShowContact(v => !v); setShowShare(false) }}
            className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white py-2.5 text-xs tracking-widest uppercase font-medium rounded-xl transition-colors">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span>{t('contact', lang)}</span>
          </button>
          <a href={`https://wa.me/${agent.whatsapp}?text=${encodeURIComponent(p.title + ' ' + shareUrl)}`} target="_blank" rel="noopener"
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white py-2.5 text-xs tracking-widest uppercase font-medium rounded-xl transition-colors">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.833L.055 23.25l5.562-1.459A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.737 9.737 0 01-5.031-1.398l-.361-.214-3.722.976.993-3.63-.235-.373A9.712 9.712 0 012.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>
            <span>WhatsApp</span>
          </a>
        </div>

        {/* Formulaire de contact */}
        {showContact && (
          <div className="px-5 py-5 border-b border-gray-100 bg-orange-50">
            {contactSent ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">✅</p>
                <p className="font-medium text-gray-900 text-sm">Message envoyé !</p>
                <p className="text-xs text-gray-500 mt-1">L&apos;agent vous contactera rapidement.</p>
              </div>
            ) : (
              <form onSubmit={async e => {
                e.preventDefault()
                setContactSending(true)
                await fetch('/api/contact', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ...contactForm, agentEmail: agent.email, propertyTitle: p.title, propertyUrl: shareUrl }),
                })
                setContactSending(false)
                setContactSent(true)
              }} className="flex flex-col gap-3">
                <p className="text-xs tracking-widest uppercase text-gray-500 mb-1">Contacter l&apos;agent</p>
                <div className="grid grid-cols-2 gap-3">
                  <input required className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white" placeholder="Votre nom *" value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} />
                  <input required type="email" className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white" placeholder="Votre email *" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <input className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white" placeholder="Téléphone" value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} />
                <textarea className="border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-orange-400 bg-white" rows={3} placeholder="Votre message..." value={contactForm.message} onChange={e => setContactForm(f => ({ ...f, message: e.target.value }))} />
                <button type="submit" disabled={contactSending}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs tracking-widest uppercase font-medium py-2.5 transition-colors">
                  {contactSending ? 'Envoi…' : 'Envoyer ma demande'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Contenu */}
        <div className="p-6">
          {p.ref && (
            <p className="text-[10px] text-gray-300 tracking-widest uppercase mb-2">Réf. {p.ref}</p>
          )}
          <p className="text-3xl font-semibold text-gray-900 mb-2">{fmtPrice(p.price)}</p>
          <h2 className="text-lg font-medium text-gray-900 mb-1">{p.translations?.title?.[lang] || p.title}</h2>
          <p className="text-sm text-gray-400 mb-6">{p.location}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-0 border border-gray-100 mb-6">
            {p.area_bruta_privativa && (
              <div className="text-center py-4 border-r border-gray-100">
                <p className="font-semibold text-gray-900">{p.area_bruta_privativa}</p>
                <p className="text-[10px] tracking-wide text-gray-400 mt-0.5">{t('areaBrutaPrivativa', lang)}</p>
              </div>
            )}
            {p.area_bruta_dependente && (
              <div className="text-center py-4 border-r border-gray-100">
                <p className="font-semibold text-gray-900">{p.area_bruta_dependente}</p>
                <p className="text-[10px] tracking-wide text-gray-400 mt-0.5">{t('areaBrutaDependente', lang)}</p>
              </div>
            )}
            {p.area_utile && (
              <div className="text-center py-4 border-r border-gray-100">
                <p className="font-semibold text-gray-900">{p.area_utile}</p>
                <p className="text-[10px] tracking-wide text-gray-400 mt-0.5">{t('areaUtile', lang)}</p>
              </div>
            )}
            {p.plot && (
              <div className="text-center py-4 border-r border-gray-100">
                <p className="font-semibold text-gray-900">{p.plot.toLocaleString()}</p>
                <p className="text-[10px] tracking-wide text-gray-400 mt-0.5">{t('land', lang)}</p>
              </div>
            )}
            {p.bedrooms && (
              <div className="text-center py-4 border-r border-gray-100">
                <p className="font-semibold text-gray-900">{p.bedrooms}</p>
                <p className="text-[10px] tracking-wide text-gray-400 mt-0.5">{t('rooms', lang)}</p>
              </div>
            )}
            {p.bathrooms && (
              <div className="text-center py-4">
                <p className="font-semibold text-gray-900">{p.bathrooms}</p>
                <p className="text-[10px] tracking-wide text-gray-400 mt-0.5">{t('baths', lang)}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {(p.translations?.description?.[lang] || p.description) && (
            <div className="mb-6">
              {(p.translations?.description?.[lang] || p.description)!.split('\n\n').map((para, i) => (
                <p key={i} className="text-gray-500 text-sm leading-relaxed mb-3">{para}</p>
              ))}
            </div>
          )}

          {/* Agent */}
          {agent.name && (
            <div className="flex items-center gap-4 pt-5 border-t border-gray-100">
              {agent.photo && (
                <img src={agent.photo} alt={agent.name} className="w-10 h-10 object-cover flex-shrink-0" />
              )}
              <div>
                <p className="text-[10px] tracking-widest text-gray-300 uppercase mb-0.5">Votre consultant</p>
                <p className="font-medium text-gray-900 text-sm">{agent.name}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
