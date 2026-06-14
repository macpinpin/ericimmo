'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Property, Buyer } from '@/lib/types'
import PropertyForm from './PropertyForm'
import BuyerForm from './BuyerForm'

const STATUS_CONFIG = {
  hot:  { label: '🔴 Chaud', bg: 'bg-red-50 text-red-600' },
  warm: { label: '🟡 Tiède', bg: 'bg-yellow-50 text-yellow-600' },
  cold: { label: '🔵 Froid', bg: 'bg-blue-50 text-blue-600' },
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'properties' | 'buyers'>('properties')

  // Biens
  const [properties, setProperties] = useState<Property[]>([])
  const [showPropertyForm, setShowPropertyForm] = useState(false)
  const [editProp, setEditProp] = useState<Property | null>(null)

  // Acheteurs
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [showBuyerForm, setShowBuyerForm] = useState(false)
  const [editBuyer, setEditBuyer] = useState<Buyer | null>(null)
  const [buyerFilter, setBuyerFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all')

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser({ id: user.id, email: user.email! })
    await Promise.all([loadProperties(user.id), loadBuyers(user.id)])
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400">Chargement…</p>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏠</span>
          <div>
            <h1 className="font-bold text-gray-900">Habiteo</h1>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/agents/eric-perniaux" target="_blank" className="text-sm text-orange-500 hover:underline font-medium">Voir ma page →</a>
          <a href="/dashboard/settings" className="text-sm text-gray-400 hover:text-gray-600">⚙️ Paramètres</a>
          <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600">Déconnexion</button>
        </div>
      </header>

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
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-3xl font-bold text-blue-500">{buyers.filter(b => b.status === 'cold').length}</p>
            <p className="text-sm text-gray-400 mt-1">🔵 Prospects froids</p>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setTab('properties')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'properties' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🏡 Mes biens ({properties.length})
          </button>
          <button
            onClick={() => setTab('buyers')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'buyers' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            👤 Acheteurs ({buyers.length})
          </button>
        </div>

        {/* Onglet Biens */}
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
                      <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
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

        {/* Onglet Acheteurs */}
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
                {filteredBuyers.map(b => (
                  <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-5">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                      {b.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{b.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[b.status].bg}`}>
                          {STATUS_CONFIG[b.status].label}
                        </span>
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-gray-400">
                        {b.phone && <span>📞 {b.phone}</span>}
                        {b.email && <span>✉️ {b.email}</span>}
                        {b.nationality && <span>🌍 {b.nationality}</span>}
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-gray-500">
                        {b.property_type && <span>🏠 {b.property_type}</span>}
                        {(b.budget_min || b.budget_max) && (
                          <span>💰 {b.budget_min ? new Intl.NumberFormat('fr-FR', {notation:'compact'}).format(b.budget_min) : '0'}€ — {b.budget_max ? new Intl.NumberFormat('fr-FR', {notation:'compact'}).format(b.budget_max) : '∞'}€</span>
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
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showPropertyForm && (
        <PropertyForm agentId={user!.id} property={editProp} onSaved={handlePropertySaved} onClose={() => { setShowPropertyForm(false); setEditProp(null) }} />
      )}
      {showBuyerForm && (
        <BuyerForm agentId={user!.id} buyer={editBuyer} onSaved={handleBuyerSaved} onClose={() => { setShowBuyerForm(false); setEditBuyer(null) }} />
      )}
    </main>
  )
}
