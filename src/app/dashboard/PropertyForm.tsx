'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Property } from '@/lib/types'
import { getDistricts, getConcelhos, getFreguesias } from '@/lib/portugal'

type Props = {
  agentId: string
  property: Property | null
  onSaved: (p: Property) => void
  onClose: () => void
}

export default function PropertyForm({ agentId, property, onSaved, onClose }: Props) {
  const [uploadedImages, setUploadedImages] = useState<string[]>(property?.images || [])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [dragSortIdx, setDragSortIdx] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [translating, setTranslating] = useState(false)
  const [translations, setTranslations] = useState<{ title?: Record<string, string>; description?: Record<string, string> }>(
    property?.translations || {}
  )

  const [form, setForm] = useState({
    title: property?.title || '',
    description: property?.description || '',
    price: property?.price?.toString() || '',
    type: property?.type || 'villa',
    status: property?.status || 'active',
    location: property?.location || '',
    district: property?.district || '',
    concelho: property?.concelho || '',
    freguesia: property?.freguesia || '',
    area_bruta_privativa: property?.area_bruta_privativa?.toString() || '',
    area_bruta_dependente: property?.area_bruta_dependente?.toString() || '',
    area_utile: property?.area_utile?.toString() || '',
    plot: property?.plot?.toString() || '',
    bedrooms: property?.bedrooms?.toString() || '',
    bathrooms: property?.bathrooms?.toString() || '',
    images: property?.images?.join('\n') || '',
    matterport_url: property?.matterport_url || '',
    video_url: property?.video_url || '',
    ref: property?.ref || '',
  })
  const [isOffmarket, setIsOffmarket] = useState(property?.is_offmarket ?? false)

  async function uploadFiles(files: FileList | File[]) {
    setUploading(true)
    const urls: string[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const ext = file.name.split('.').pop()
      const path = `${agentId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('property-images').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('property-images').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    setUploadedImages(prev => [...prev, ...urls])
    setUploading(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files)
  }

  function removeImage(url: string) {
    setUploadedImages(prev => prev.filter(u => u !== url))
  }

  function handleSortDragStart(idx: number) {
    setDragSortIdx(idx)
  }

  function handleSortDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragSortIdx === null || dragSortIdx === idx) return
    setUploadedImages(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragSortIdx, 1)
      next.splice(idx, 0, moved)
      return next
    })
    setDragSortIdx(idx)
  }

  function handleSortDragEnd() {
    setDragSortIdx(null)
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function translateDescription() {
    if (!form.description || !form.title) {
      setError('Remplissez le titre et la description avant de traduire.')
      return
    }
    setTranslating(true)
    setError('')
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: form.description, title: form.title }),
    })
    const text = await res.text()
    let data: any = {}
    try { data = JSON.parse(text) } catch { setError('Erreur serveur : ' + text.slice(0, 200)); setTranslating(false); return }
    if (data.translations?.title && data.translations?.description) {
      setTranslations(data.translations)
    } else {
      setError('Erreur de traduction : ' + (data.error || 'inconnue'))
    }
    setTranslating(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const images = uploadedImages

    const payload = {
      agent_id: agentId,
      title: form.title,
      description: form.description || null,
      price: parseFloat(form.price),
      type: form.type,
      status: form.status,
      location: form.location,
      district: form.district || null,
      concelho: form.concelho || null,
      freguesia: form.freguesia || null,
      area_bruta_privativa: form.area_bruta_privativa ? parseFloat(form.area_bruta_privativa) : null,
      area_bruta_dependente: form.area_bruta_dependente ? parseFloat(form.area_bruta_dependente) : null,
      area_utile: form.area_utile ? parseFloat(form.area_utile) : null,
      plot: form.plot ? parseFloat(form.plot) : null,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
      images,
      matterport_url: form.matterport_url || null,
      video_url: form.video_url || null,
      ref: form.ref || null,
      is_offmarket: isOffmarket,
      translations: Object.keys(translations).length > 0 ? translations : null,
    }

    let result
    if (property) {
      result = await supabase.from('properties').update(payload).eq('id', property.id).select().single()
    } else {
      result = await supabase.from('properties').insert(payload).select().single()
    }

    if (result.error) {
      setError(result.error.message)
    } else {
      onSaved(result.data as Property)
    }
    setLoading(false)
  }

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {property ? 'Modifier le bien' : 'Ajouter un bien'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Titre */}
          <div>
            <label className={labelClass}>Titre *</label>
            <input className={inputClass} value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Ex: Villa avec piscine à Carvoeiro" />
          </div>

          {/* Type + Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Type *</label>
              <select className={inputClass} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="villa">Villa / Maison</option>
                <option value="apartment">Appartement</option>
                <option value="land">Terrain</option>
                <option value="commercial">Commercial</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Statut</label>
              <select className={inputClass} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="active">Actif</option>
                <option value="draft">Brouillon</option>
                <option value="sold">Vendu</option>
              </select>
            </div>
          </div>

          {/* Off-market toggle */}
          <button
            type="button"
            onClick={() => setIsOffmarket(v => !v)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-sm font-semibold ${isOffmarket ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-400 hover:border-gray-300'}`}
          >
            <span className={`w-10 h-6 rounded-full flex items-center transition-all ${isOffmarket ? 'bg-amber-400' : 'bg-gray-200'}`}>
              <span className={`w-5 h-5 rounded-full bg-white shadow transition-all mx-0.5 ${isOffmarket ? 'translate-x-4' : ''}`} />
            </span>
            🔒 Bien off-market — non visible sur le site public, participe au matching
          </button>

          {/* Prix + Réf */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prix (€) *</label>
              <input className={inputClass} type="number" value={form.price} onChange={e => set('price', e.target.value)} required placeholder="350000" />
            </div>
            <div>
              <label className={labelClass}>Référence</label>
              <input className={inputClass} value={form.ref} onChange={e => set('ref', e.target.value)} placeholder="SAFTI:007718" />
            </div>
          </div>

          {/* Localisation */}
          <div>
            <label className={labelClass}>Localisation (affichée sur l'annonce) *</label>
            <input className={inputClass} value={form.location} onChange={e => set('location', e.target.value)} required placeholder="Carvoeiro, Lagoa, Algarve" />
          </div>

          {/* District / Concelho / Freguesia */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>District</label>
              <select className={inputClass} value={form.district} onChange={e => { set('district', e.target.value); set('concelho', ''); set('freguesia', '') }}>
                <option value="">— Sélectionner —</option>
                {getDistricts().map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Concelho</label>
              <select className={inputClass} value={form.concelho} onChange={e => { set('concelho', e.target.value); set('freguesia', '') }} disabled={!form.district}>
                <option value="">— {form.district ? 'Sélectionner' : 'Choisir district d\'abord'} —</option>
                {getConcelhos(form.district).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Freguesia</label>
              <select className={inputClass} value={form.freguesia} onChange={e => set('freguesia', e.target.value)} disabled={!form.district}>
                <option value="">— {form.district ? 'Sélectionner' : 'Choisir district d\'abord'} —</option>
                {getFreguesias(form.district, form.concelho).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Surfaces */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Surface brute privative (m²)</label>
              <input className={inputClass} type="number" value={form.area_bruta_privativa} onChange={e => set('area_bruta_privativa', e.target.value)} placeholder="292" />
            </div>
            <div>
              <label className={labelClass}>Surface brute dépendante (m²)</label>
              <input className={inputClass} type="number" value={form.area_bruta_dependente} onChange={e => set('area_bruta_dependente', e.target.value)} placeholder="45" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Surface utile (m²)</label>
              <input className={inputClass} type="number" value={form.area_utile} onChange={e => set('area_utile', e.target.value)} placeholder="240" />
            </div>
            <div>
              <label className={labelClass}>Surface terrain (m²)</label>
              <input className={inputClass} type="number" value={form.plot} onChange={e => set('plot', e.target.value)} placeholder="9140" />
            </div>
          </div>

          {/* Chambres + SDB */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Chambres</label>
              <input className={inputClass} type="number" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} placeholder="5" />
            </div>
            <div>
              <label className={labelClass}>Salles de bain</label>
              <input className={inputClass} type="number" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} placeholder="4" />
            </div>
          </div>

          {/* Photos */}
          <div>
            <label className={labelClass}>Photos</label>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => e.target.files && uploadFiles(e.target.files)}
              />
              {uploading ? (
                <p className="text-orange-500 font-medium">Upload en cours…</p>
              ) : (
                <>
                  <p className="text-3xl mb-2">📸</p>
                  <p className="text-gray-500 text-sm font-medium">Glissez vos photos ici</p>
                  <p className="text-gray-400 text-xs mt-1">ou cliquez pour sélectionner depuis votre Mac</p>
                </>
              )}
            </div>
            {uploadedImages.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-2">📌 Glissez pour changer l'ordre · {uploadedImages.length} photo{uploadedImages.length > 1 ? 's' : ''} · La 1ère sera la photo principale</p>
                <div className="grid grid-cols-4 gap-2">
                  {uploadedImages.map((url, i) => (
                    <div
                      key={url}
                      draggable
                      onDragStart={() => handleSortDragStart(i)}
                      onDragOver={e => handleSortDragOver(e, i)}
                      onDragEnd={handleSortDragEnd}
                      className={`relative group cursor-grab active:cursor-grabbing rounded-lg overflow-hidden ${dragSortIdx === i ? 'opacity-50 ring-2 ring-orange-400' : ''}`}
                    >
                      <img src={url} className="w-full h-20 object-cover" />
                      <span className="absolute top-1 left-1 bg-black/60 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Matterport */}
          <div>
            <label className={labelClass}>URL Matterport (visite 360°)</label>
            <input
              className={inputClass}
              value={form.matterport_url}
              onChange={e => set('matterport_url', e.target.value)}
              placeholder="https://my.matterport.com/show/?m=XXXXX"
            />
          </div>

          {/* Vidéo YouTube */}
          <div>
            <label className={labelClass}>URL Vidéo YouTube</label>
            <input
              className={inputClass}
              value={form.video_url}
              onChange={e => set('video_url', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=XXXXX"
            />
            <p className="text-xs text-gray-400 mt-1">Copiez le lien YouTube de la vidéo du bien</p>
          </div>

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={labelClass} style={{marginBottom:0}}>Description (français)</label>
              <button
                type="button"
                onClick={translateDescription}
                disabled={translating}
                className="text-xs bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                {translating ? '⏳ Traduction en cours…' : '✨ Traduire avec Claude'}
              </button>
            </div>
            <textarea
              className={`${inputClass} resize-none`}
              rows={5}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Description du bien en français..."
            />
          </div>

          {/* Traductions générées */}
          {translations.description && Object.keys(translations.description).length > 0 && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-purple-700 mb-3">✅ Traductions générées par Claude ({Object.keys(translations.description).length} langues)</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(translations.description).map(([code, text]) => (
                  <div key={code} className="bg-white rounded-lg p-2 text-xs">
                    <p className="font-bold text-purple-600 uppercase mb-1">{code} — {translations.title?.[code] || ''}</p>
                    <p className="text-gray-500 line-clamp-2">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Enregistrement…' : property ? 'Enregistrer les modifications' : 'Ajouter le bien'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
