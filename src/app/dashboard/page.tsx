'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Property, Buyer, Match } from '@/lib/types'
import PropertyForm from './PropertyForm'
import BuyerForm from './BuyerForm'

const STATUS_CONFIG = {
  hot:  { label: '🔴 Chaud', bg: 'bg-red-50 text-red-600' },
  warm: { label: '🟡 Tiède', bg: 'bg-yellow-50 text-yellow-600' },
  cold: { label: '🔵 Froid', bg: 'bg-blue-50 text-blue-600' },
}

function InviteTab() {
  const [form, setForm] = useState({ name: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState<string[]>([])
  const [error, setError] = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (data.error) setError(data.error)
    else {
      setSent(prev => [...prev, form.email])
      setForm({ name: '', email: '' })
    }
    setLoading(false)
  }

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Inviter un agent</h2>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <form onSubmit={handleInvite} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prénom / Nom</label>
            <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Marie Martin" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input className={inp} type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="marie@safti.fr" />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
            {loading ? 'Envoi…' : '✉️ Envoyer l\'invitation'}
          </button>
        </form>

        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Code beta envoyé</p>
          <p className="text-lg font-bold text-orange-500 tracking-widest">HABITEO2025</p>
        </div>
      </div>

      {sent.length > 0 && (
        <div className="mt-4 bg-green-50 border border-green-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-green-700 mb-2">✅ Invitations envoyées</p>
          {sent.map(email => (
            <p key={email} className="text-sm text-green-600">• {email}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function PhotoCropper({ currentUrl, onUploaded, userId }: { currentUrl: string; onUploaded: (url: string) => void; userId: string }) {
  const [originalUrl, setOriginalUrl] = useState<string | null>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [uploading, setUploading] = useState(false)
  const [dropOver, setDropOver] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const SIZE = 230

  function loadFile(file: File) {
    const reader = new FileReader()
    reader.onload = ev => {
      const src = ev.target?.result as string
      setImgSrc(src)
      setOriginalUrl(null) // nouvelle photo = pas d'original en DB
      setZoom(1); setOffsetX(0); setOffsetY(0)
    }
    reader.readAsDataURL(file)
  }

  function loadOriginalForEdit() {
    const originalPath = `https://bznztsufkektfabevojb.supabase.co/storage/v1/object/public/agent-photos/agents/${userId}/photo_original`
    fetch(originalPath)
      .then(r => {
        if (!r.ok) throw new Error('not found')
        return r.blob()
      })
      .catch(() => fetch(currentUrl).then(r => r.blob()))
      .then(blob => {
        const saved = localStorage.getItem(`photo_crop_${userId}`)
        const crop = saved ? JSON.parse(saved) : { zoom: 1, offsetX: 0, offsetY: 0 }
        const reader = new FileReader()
        reader.onload = ev => {
          setImgSrc(ev.target?.result as string)
          setZoom(crop.zoom)
          setOffsetX(crop.offsetX)
          setOffsetY(crop.offsetY)
        }
        reader.readAsDataURL(blob)
      })
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDropOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) loadFile(file)
  }

  function drawCanvas(src: string, z: number, ox: number, oy: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = imgRef.current || new Image()
    imgRef.current = img
    img.onload = () => {
      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.save()
      ctx.beginPath()
      ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, SIZE, SIZE)
      const iw = img.naturalWidth * z
      const ih = img.naturalHeight * z
      const x = (SIZE - iw) / 2 + ox
      const y = (SIZE - ih) / 2 + oy
      ctx.drawImage(img, x, y, iw, ih)
      ctx.restore()
    }
    if (img.src !== src) img.src = src
    else img.onload?.(new Event('load'))
  }

  useEffect(() => {
    if (imgSrc) drawCanvas(imgSrc, zoom, offsetX, offsetY)
  }, [imgSrc, zoom, offsetX, offsetY])

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true)
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY })
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return
    setOffsetX(e.clientX - dragStart.x)
    setOffsetY(e.clientY - dragStart.y)
  }
  function onMouseUp() { setDragging(false) }

  async function handleUpload() {
    const canvas = canvasRef.current
    if (!canvas || !imgSrc) return
    setUploading(true)

    // Sauvegarde l'original si c'est une nouvelle photo (pas un re-cadrage)
    if (!originalUrl) {
      const origBlob = await fetch(imgSrc).then(r => r.blob())
      await supabase.storage.from('agent-photos').upload(`agents/${userId}/photo_original`, origBlob, { upsert: true })
    }
    // Mémorise zoom/position pour la prochaine modification
    localStorage.setItem(`photo_crop_${userId}`, JSON.stringify({ zoom, offsetX, offsetY }))

    canvas.toBlob(async blob => {
      if (!blob) { setUploading(false); return }
      const path = `agents/${userId}/photo.png`
      const { error } = await supabase.storage.from('agent-photos').upload(path, blob, { upsert: true, contentType: 'image/png' })
      if (error) { alert('Erreur upload : ' + error.message); setUploading(false); return }
      const { data } = supabase.storage.from('agent-photos').getPublicUrl(path)
      onUploaded(data.publicUrl + '?t=' + Date.now())
      setImgSrc(null)
      setUploading(false)
    }, 'image/png')
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">Photo de profil</label>
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          {imgSrc ? (
            <div>
              <canvas
                ref={canvasRef}
                width={SIZE} height={SIZE}
                className="rounded-full border-4 border-orange-200 cursor-grab active:cursor-grabbing"
                style={{ width: SIZE, height: SIZE }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
              />
              <div className="mt-2">
                <input type="range" min={0.1} max={3} step={0.05} value={zoom}
                  onChange={e => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-orange-500" />
                <p className="text-xs text-gray-400 text-center mt-1">🔍 Zoom · glisse pour cadrer</p>
              </div>
            </div>
          ) : (
            <div className="relative group w-[230px] h-[230px]">
              <div className="w-full h-full rounded-full border-4 border-gray-100 overflow-hidden bg-white flex items-center justify-center">
                {currentUrl
                  ? <img src={currentUrl} className="w-full h-full object-cover object-top" alt="photo" />
                  : <span className="text-4xl">👤</span>}
              </div>
              {currentUrl && (
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <button type="button" onClick={() => { setOriginalUrl(currentUrl); loadOriginalForEdit() }}
                    className="cursor-pointer text-white text-xs font-semibold bg-white/20 hover:bg-white/30 px-2 py-1 rounded-lg">
                    ✏️ Modifier
                  </button>
                  <button type="button" onClick={async () => {
                    if (!confirm('Supprimer la photo ?')) return
                    await supabase.from('agents').update({ photo_url: null }).eq('id', userId)
                    onUploaded('')
                  }} className="text-white text-xs font-semibold bg-white/20 hover:bg-red-500/70 px-2 py-1 rounded-lg">
                    🗑️ Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 flex-1">
          {/* Zone drop */}
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDropOver(true) }}
            onDragLeave={() => setDropOver(false)}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${dropOver ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}
          >
            <p className="text-2xl mb-1">🖼️</p>
            <p className="text-sm text-gray-500 font-medium">Glisse ta photo ici</p>
            <p className="text-xs text-gray-400 mt-1">ou</p>
            <label className="mt-2 inline-block cursor-pointer bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 font-medium text-sm px-4 py-2 rounded-xl transition-colors">
              📁 Choisir un fichier
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          </div>

          {imgSrc && (
            <button type="button" onClick={handleUpload} disabled={uploading}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-colors">
              {uploading ? 'Envoi…' : '✅ Valider la photo'}
            </button>
          )}
          <p className="text-xs text-gray-400">JPG, PNG — max 5 Mo</p>
        </div>
      </div>
    </div>
  )
}

function ProfileTab({ userId }: { userId: string }) {
  const [form, setForm] = useState({ name: '', phone: '', whatsapp: '', bio: '', powered_by: '', slug: '', contact_email: '' })
  const [photoUrl, setPhotoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('agents').select('name,phone,whatsapp,bio,powered_by,slug,photo_url,contact_email,email').eq('id', userId).single()
      .then(({ data }) => {
        if (data) {
          setForm({
            name: data.name || '',
            phone: data.phone || '',
            whatsapp: data.whatsapp || '',
            bio: data.bio || '',
            powered_by: data.powered_by || 'Powered by SAFTI',
            slug: data.slug || '',
            contact_email: data.contact_email || data.email || '',
          })
          setPhotoUrl(data.photo_url || '')
        }
        setLoading(false)
      })
  }, [userId])

  async function handlePhotoUploaded(url: string) {
    setPhotoUrl(url)
    await supabase.from('agents').update({ photo_url: url }).eq('id', userId)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('agents').update({
      name: form.name,
      phone: form.phone,
      whatsapp: form.whatsapp,
      bio: form.bio,
      powered_by: form.powered_by,
      slug: form.slug,
      contact_email: form.contact_email || null,
    }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"

  if (loading) return <p className="text-gray-400 text-sm">Chargement...</p>

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Mon profil public</h2>
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="mb-6 pb-6 border-b border-gray-100">
          <PhotoCropper currentUrl={photoUrl} onUploaded={handlePhotoUploaded} userId={userId} />
        </div>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input className={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL de votre minisite)</label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">/agents/</span>
              <input className={inp} value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="prenom-nom" />
            </div>
            {form.slug && <p className="text-xs text-gray-400 mt-1">→ /agents/{form.slug}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input className={inp} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+351 961 000 000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (sans +, ex: 351961000000)</label>
            <input className={inp} value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="351961000000" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email de contact (reçoit les leads)</label>
            <input className={inp} type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} placeholder="votre@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Réseau / Enseigne</label>
            <input className={inp} value={form.powered_by} onChange={e => setForm(f => ({ ...f, powered_by: e.target.value }))} placeholder="Powered by SAFTI" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio (texte affiché sur votre minisite)</label>
            <textarea className={inp} rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Spécialiste de l'immobilier en Algarve..." />
          </div>
          <button type="submit" disabled={saving}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
            {saving ? 'Enregistrement…' : saved ? '✅ Enregistré !' : 'Enregistrer'}
          </button>
        </form>
      </div>
      {form.slug && (
        <a href={`/agents/${form.slug}`} target="_blank" className="mt-4 text-sm text-orange-500 hover:underline font-medium flex items-center gap-1">
          Voir mon minisite → /agents/{form.slug}
        </a>
      )}
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-green-400' : score >= 60 ? 'bg-orange-400' : 'bg-gray-300'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-sm font-bold ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-orange-500' : 'text-gray-400'}`}>{score}%</span>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'properties' | 'buyers' | 'matches' | 'invite' | 'profile'>('properties')
  const [agentSlug, setAgentSlug] = useState<string | null>(null)
  const isAdmin = user?.email === 'macpinpin@me.com'

  const [properties, setProperties] = useState<Property[]>([])
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [editProp, setEditProp] = useState<Property | null>(null)

  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [showBuyerForm, setShowBuyerForm] = useState(false)
  const [editBuyer, setEditBuyer] = useState<Buyer | null>(null)
  const [buyerFilter, setBuyerFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all')
  const [expandedBuyer, setExpandedBuyer] = useState<string | null>(null)

  const [matches, setMatches] = useState<Match[]>([])
  const [matchFilter, setMatchFilter] = useState<'all' | 'new' | 'seen' | 'dismissed'>('new')
  const [running, setRunning] = useState(false)

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser({ id: user.id, email: user.email! })
    supabase.from('agents').select('slug').eq('id', user.id).single().then(({ data }) => {
      if (data?.slug) setAgentSlug(data.slug)
    })
    await Promise.all([loadProperties(user.id), loadBuyers(user.id), loadMatches(user.id)])
    setLoading(false)
  }

  async function loadProperties(agentId: string) {
    const { data } = await supabase.from('properties').select('*').eq('agent_id', agentId).order('created_at', { ascending: false })
    setProperties(data || [])
  }

  async function loadBuyers(agentId: string) {
    const { data } = await supabase.from('buyers').select('*').eq('agent_id', agentId).order('last_contact', { ascending: false })
    setBuyers(data || [])
  }

  async function loadMatches(agentId: string) {
    const { data } = await supabase
      .from('matches')
      .select('*, buyer:buyers(*), property:properties(*), buyer_agent:agents!buyer_agent_id(id,name,phone,contact_email,email,whatsapp), seller_agent:agents!seller_agent_id(id,name,phone,contact_email,email,whatsapp)')
      .or(`buyer_agent_id.eq.${agentId},seller_agent_id.eq.${agentId}`)
      .order('created_at', { ascending: false })
    setMatches((data || []) as Match[])
  }

  async function triggerMatching() {
    setRunning(true)
    try {
      const res = await fetch('/api/match/run', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      await loadMatches(user!.id)
      setTab('matches')
      alert(`Matching terminé — ${data.matched} nouveau(x) match(s) trouvé(s)`)
    } catch (e: any) {
      alert(`Erreur : ${e.message}`)
    } finally {
      setRunning(false)
    }
  }

  async function updateMatchStatus(id: string, status: 'seen' | 'dismissed') {
    await supabase.from('matches').update({ status }).eq('id', id)
    setMatches(prev => prev.map(m => m.id === id ? { ...m, status } : m))
  }

  async function deleteProperty(id: string) {
    if (!confirm('Supprimer ce bien ?')) return
    await supabase.from('properties').delete().eq('id', id)
    setProperties(prev => prev.filter(p => p.id !== id))
  }

  async function deleteBuyer(id: string) {
    if (!confirm('Supprimer cet acheteur ?')) return
    await supabase.from('buyers').delete().eq('id', id)
    setBuyers(prev => prev.filter(b => b.id !== id))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function handlePropertySaved(prop: Property) {
    if (editProp) setProperties(prev => prev.map(p => p.id === prop.id ? prop : p))
    else setProperties(prev => [prop, ...prev])
    setShowPropertyForm(false)
    setEditProp(null)
  }

  function handleBuyerSaved(buyer: Buyer) {
    if (editBuyer) setBuyers(prev => prev.map(b => b.id === buyer.id ? buyer : b))
    else setBuyers(prev => [buyer, ...prev])
    setShowBuyerForm(false)
    setEditBuyer(null)
  }

  const filteredBuyers = buyerFilter === 'all' ? buyers : buyers.filter(b => b.status === buyerFilter)
  const filteredMatches = matchFilter === 'all' ? matches : matches.filter(m => m.status === matchFilter)
  const newMatchCount = matches.filter(m => m.status === 'new').length

  function getBuyerMatches(buyerId: string) {
    return matches.filter(m => m.buyer_id === buyerId && m.status !== 'dismissed')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Chargement…</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏠</span>
          <div>
            <h1 className="font-bold text-gray-900">Habiteo</h1>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/biens" className="text-sm text-gray-400 hover:text-gray-600">🌐 Site public</a>
          {agentSlug && <a href={`/agents/${agentSlug}`} target="_blank" className="text-sm text-orange-500 hover:underline font-medium">Voir ma page →</a>}
          <a href="/dashboard/settings" className="text-sm text-gray-400 hover:text-gray-600">⚙️ Paramètres</a>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600">Déconnexion</button>
        </div>
      </header>

      {/* Bandeau onboarding si profil incomplet */}
      {!form.phone && !form.bio && !photoUrl && (
        <div className="bg-orange-50 border-b border-orange-100 px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👋</span>
              <div>
                <p className="font-semibold text-orange-800 text-sm">Bienvenue sur Habiteo ! Complétez votre profil pour activer votre minisite.</p>
                <p className="text-xs text-orange-600 mt-0.5">Ajoutez votre photo, téléphone et bio pour que vos clients puissent vous contacter.</p>
              </div>
            </div>
            <button onClick={() => setTab('profile')}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap">
              Compléter mon profil →
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-3xl font-bold text-gray-900">{properties.length}</p>
            <p className="text-sm text-gray-400 mt-1">Biens</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-3xl font-bold text-red-500">{buyers.filter(b => b.status === 'hot').length}</p>
            <p className="text-sm text-gray-400 mt-1">🔴 Prospects chauds</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-3xl font-bold text-yellow-500">{buyers.filter(b => b.status === 'warm').length}</p>
            <p className="text-sm text-gray-400 mt-1">🟡 Prospects tièdes</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 relative">
            <p className="text-3xl font-bold text-orange-500">{newMatchCount}</p>
            <p className="text-sm text-gray-400 mt-1">🔔 Nouveaux matchs</p>
            {newMatchCount > 0 && <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />}
          </div>
        </div>

        {/* Onglets */}
        <div className="flex items-center justify-between mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          <button onClick={() => setTab('properties')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'properties' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            🏡 Mes biens ({properties.length})
          </button>
          <button onClick={() => setTab('buyers')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'buyers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            👤 Acheteurs ({buyers.length})
          </button>
          <button onClick={() => setTab('matches')}
            className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'matches' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            🔔 Matchs ({matches.length})
            {newMatchCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold bg-orange-500 text-white rounded-full flex items-center justify-center">{newMatchCount}</span>}
          </button>
          {isAdmin && (
            <button onClick={() => setTab('invite')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'invite' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              ✉️ Invitations
            </button>
          )}
          <button onClick={() => setTab('profile')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'profile' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            👤 Profil
          </button>
        </div>
        <button onClick={triggerMatching} disabled={running}
          className="text-sm bg-orange-50 text-orange-500 border border-orange-200 hover:bg-orange-100 disabled:opacity-50 font-semibold px-4 py-2 rounded-xl transition-colors">
          {running ? '⏳ Matching…' : '🔍 Lancer le matching'}
        </button>
        </div>

        {/* ── Onglet Biens ── */}
        {tab === 'properties' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Mes biens</h2>
              <button onClick={() => { setEditProp(null); setShowPropertyForm(true) }}
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                + Ajouter un bien
              </button>
            </div>
            {properties.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <p className="text-4xl mb-3">🏡</p>
                <p className="text-gray-500 mb-4">Aucun bien pour l'instant</p>
                <button onClick={() => setShowPropertyForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                  Ajouter mon premier bien
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {properties.map(p => (
                  <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-5">
                    {p.images?.[0] && <img src={p.images[0]} alt={p.title} className="w-20 h-16 object-cover rounded-lg flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                        {p.is_offmarket && <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium flex-shrink-0">🔒 Off-market</span>}
                      </div>
                      <p className="text-sm text-gray-400">{p.location}</p>
                      <p className="text-sm font-bold text-orange-500 mt-1">
                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.matterport_url && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-medium">360°</span>}
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${p.status === 'active' ? 'bg-green-50 text-green-600' : p.status === 'sold' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-50 text-yellow-600'}`}>
                        {p.status === 'active' ? 'Actif' : p.status === 'sold' ? 'Vendu' : 'Brouillon'}
                      </span>
                      <button onClick={() => { setEditProp(p); setShowPropertyForm(true) }} className="text-sm text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Modifier</button>
                      <button onClick={() => deleteProperty(p.id)} className="text-sm text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Supprimer</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Onglet Acheteurs ── */}
        {tab === 'buyers' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {(['all', 'hot', 'warm', 'cold'] as const).map(f => (
                  <button key={f} onClick={() => setBuyerFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${buyerFilter === f ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                    {f === 'all' ? `Tous (${buyers.length})` : f === 'hot' ? `🔴 Chauds (${buyers.filter(b => b.status === 'hot').length})` : f === 'warm' ? `🟡 Tièdes (${buyers.filter(b => b.status === 'warm').length})` : `🔵 Froids (${buyers.filter(b => b.status === 'cold').length})`}
                  </button>
                ))}
              </div>
              <button onClick={() => { setEditBuyer(null); setShowBuyerForm(true) }}
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                + Ajouter un acheteur
              </button>
            </div>
            {filteredBuyers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <p className="text-4xl mb-3">👤</p>
                <p className="text-gray-500 mb-4">Aucun acheteur pour l'instant</p>
                <button onClick={() => setShowBuyerForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                  Ajouter mon premier acheteur
                </button>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredBuyers.map(b => {
                  const bMatches = getBuyerMatches(b.id)
                  const isExpanded = expandedBuyer === b.id
                  return (
                    <div key={b.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div className="p-5 flex items-center gap-5">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                          {b.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{b.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[b.status].bg}`}>
                              {STATUS_CONFIG[b.status].label}
                            </span>
                            {bMatches.length > 0 && (
                              <button onClick={() => setExpandedBuyer(isExpanded ? null : b.id)}
                                className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full font-semibold hover:bg-orange-100 transition-colors">
                                🔔 {bMatches.length} match{bMatches.length > 1 ? 's' : ''}
                              </button>
                            )}
                          </div>
                          <div className="flex gap-4 mt-1 text-xs text-gray-400">
                            {b.phone && <span>📞 {b.phone}</span>}
                            {b.email && <span>✉️ {b.email}</span>}
                            {b.nationality && <span>🌍 {b.nationality}</span>}
                          </div>
                          <div className="flex gap-4 mt-1 text-xs text-gray-500">
                            {b.property_type && <span>🏠 {b.property_type}</span>}
                            {(b.budget_min || b.budget_max) && (
                              <span>💰 {b.budget_min ? new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(b.budget_min) : '0'}€ — {b.budget_max ? new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(b.budget_max) : '∞'}€</span>
                            )}
                            {b.district && <span>📍 {b.district}{b.concelho ? ` › ${b.concelho}` : ''}</span>}
                            {b.last_contact && <span>🕐 {new Date(b.last_contact).toLocaleDateString('fr-FR')}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button onClick={() => { setEditBuyer(b); setShowBuyerForm(true) }} className="text-sm text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">Modifier</button>
                          <button onClick={() => deleteBuyer(b.id)} className="text-sm text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">Supprimer</button>
                        </div>
                      </div>
                      {/* Matchs de cet acheteur */}
                      {isExpanded && bMatches.length > 0 && (
                        <div className="border-t border-gray-50 bg-orange-50/30 px-5 py-4 flex flex-col gap-3">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Biens correspondants</p>
                          {bMatches.map(m => {
                            const prop = m.property as Property | undefined
                            if (!prop) return null
                            return (
                              <div key={m.id} className="bg-white rounded-xl p-4 flex items-center gap-4 border border-gray-100">
                                {prop.images?.[0] && <img src={prop.images[0]} className="w-14 h-12 object-cover rounded-lg flex-shrink-0" />}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-sm text-gray-900 truncate">{prop.title}</p>
                                    {prop.is_offmarket && <span className="text-xs bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-medium">🔒 Off-market</span>}
                                  </div>
                                  <p className="text-xs text-gray-400">{prop.location} · {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(prop.price)}</p>
                                  <div className="mt-2 max-w-xs"><ScoreBar score={m.score} /></div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  {m.status === 'new' && <button onClick={() => updateMatchStatus(m.id, 'seen')} className="text-xs px-3 py-1.5 bg-green-50 text-green-600 rounded-lg font-medium hover:bg-green-100 transition-colors">✓ Vu</button>}
                                  <button onClick={() => updateMatchStatus(m.id, 'dismissed')} className="text-xs px-3 py-1.5 bg-gray-50 text-gray-400 rounded-lg font-medium hover:bg-gray-100 transition-colors">✕ Ignorer</button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Onglet Matchs ── */}
        {tab === 'matches' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                {(['new', 'seen', 'all', 'dismissed'] as const).map(f => (
                  <button key={f} onClick={() => setMatchFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${matchFilter === f ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                    {f === 'new' ? `🆕 Nouveaux (${matches.filter(m => m.status === 'new').length})` : f === 'seen' ? `✓ Vus (${matches.filter(m => m.status === 'seen').length})` : f === 'all' ? `Tous (${matches.length})` : `✕ Ignorés (${matches.filter(m => m.status === 'dismissed').length})`}
                  </button>
                ))}
              </div>
            </div>
            {filteredMatches.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <p className="text-4xl mb-3">🔔</p>
                <p className="text-gray-500">Aucun match pour l'instant</p>
                <p className="text-xs text-gray-400 mt-2">Le matching s'exécute automatiquement chaque matin à 8h</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredMatches.map(m => {
                  const buyer = m.buyer as Buyer | undefined
                  const prop = m.property as Property | undefined
                  const isMine = m.buyer_agent_id === user?.id
                  const partnerAgent = isMine ? (m as any).seller_agent : (m as any).buyer_agent
                  const isInterAgent = m.buyer_agent_id !== m.seller_agent_id
                  return (
                    <div key={m.id} className={`bg-white rounded-xl border p-5 ${m.status === 'new' ? 'border-orange-200 shadow-sm shadow-orange-50' : 'border-gray-100'}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            {m.status === 'new' && <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />}
                            <ScoreBar score={m.score} />
                            {prop?.is_offmarket && <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium">🔒 Off-market</span>}
                            <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-xl p-3">
                              <p className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">
                                {isMine ? '👤 Votre acheteur' : '👤 Acheteur confrère'}
                              </p>
                              {isMine && buyer ? (
                                <>
                                  <p className="font-semibold text-sm text-gray-900">{buyer.name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {[buyer.property_type, buyer.budget_max ? new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(buyer.budget_max) + '€ max' : null].filter(Boolean).join(' · ')}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs text-gray-400 italic mb-2">Coordonnées confidentielles</p>
                                  {isInterAgent && partnerAgent && (
                                    <div className="border-t border-blue-100 pt-2 mt-1">
                                      <p className="text-xs font-semibold text-blue-600 mb-1">Agent à contacter :</p>
                                      <p className="text-sm font-semibold text-gray-900">{partnerAgent.name}</p>
                                      {partnerAgent.phone && <a href={`tel:${partnerAgent.phone}`} className="text-xs text-gray-600 hover:text-orange-500 block mt-0.5">📞 {partnerAgent.phone}</a>}
                                      {partnerAgent.whatsapp && <a href={`https://wa.me/${partnerAgent.whatsapp}`} target="_blank" rel="noopener" className="text-xs text-green-600 hover:text-green-700 block mt-0.5">💬 WhatsApp</a>}
                                      <a href={`mailto:${partnerAgent.contact_email || partnerAgent.email}`} className="text-xs text-orange-500 hover:underline block mt-0.5">✉️ {partnerAgent.contact_email || partnerAgent.email}</a>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="bg-green-50 rounded-xl p-3">
                              <p className="text-xs font-bold text-green-400 uppercase tracking-wide mb-1">
                                {m.seller_agent_id === user?.id ? '🏡 Votre bien' : '🏡 Bien confrère'}
                              </p>
                              {prop ? (
                                <>
                                  <p className="font-semibold text-sm text-gray-900">{prop.title}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {prop.location} · {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(prop.price)}
                                  </p>
                                </>
                              ) : <p className="text-xs text-gray-400 italic">—</p>}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          {m.status === 'new' && (
                            <button onClick={() => updateMatchStatus(m.id, 'seen')}
                              className="text-xs px-4 py-2 bg-green-50 text-green-600 rounded-lg font-semibold hover:bg-green-100 transition-colors">
                              ✓ Marquer comme vu
                            </button>
                          )}
                          {m.status !== 'dismissed' && (
                            <button onClick={() => updateMatchStatus(m.id, 'dismissed')}
                              className="text-xs px-4 py-2 bg-gray-50 text-gray-400 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                              ✕ Ignorer
                            </button>
                          )}
                          {m.status === 'dismissed' && (
                            <button onClick={() => updateMatchStatus(m.id, 'seen')}
                              className="text-xs px-4 py-2 bg-gray-50 text-gray-500 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                              ↩ Restaurer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Onglet Invitations (admin only) ── */}
      {tab === 'invite' && isAdmin && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          <InviteTab />
        </div>
      )}

      {/* ── Onglet Profil ── */}
      {tab === 'profile' && user && (
        <div className="max-w-5xl mx-auto px-6 py-8">
          <ProfileTab userId={user.id} />
        </div>
      )}

      {showPropertyForm && (
        <PropertyForm agentId={user!.id} property={editProp} onSaved={handlePropertySaved} onClose={() => { setShowPropertyForm(false); setEditProp(null) }} />
      )}
      {showBuyerForm && (
        <BuyerForm agentId={user!.id} buyer={editBuyer} onSaved={handleBuyerSaved} onClose={() => { setShowBuyerForm(false); setEditBuyer(null) }} />
      )}
    </main>
  )
}
