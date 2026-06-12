'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { Property } from '@/lib/types'
import PropertyForm from './PropertyForm'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editProp, setEditProp] = useState<Property | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser({ id: user.id, email: user.email! })
    loadProperties(user.id)
  }

  async function loadProperties(agentId: string) {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
    setProperties(data || [])
    setLoading(false)
  }

  async function deleteProperty(id: string) {
    if (!confirm('Supprimer ce bien ?')) return
    await supabase.from('properties').delete().eq('id', id)
    setProperties(prev => prev.filter(p => p.id !== id))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function handleSaved(prop: Property) {
    if (editProp) {
      setProperties(prev => prev.map(p => p.id === prop.id ? prop : p))
    } else {
      setProperties(prev => [prop, ...prev])
    }
    setShowForm(false)
    setEditProp(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Chargement…</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏠</span>
          <div>
            <h1 className="font-bold text-gray-900">EricImmo</h1>
            <p className="text-xs text-gray-400">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/agents/eric-perniaux"
            target="_blank"
            className="text-sm text-orange-500 hover:underline font-medium"
          >
            Voir ma page →
          </a>
          <a
            href="/dashboard/settings"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ⚙️ Paramètres
          </a>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-3xl font-bold text-gray-900">{properties.length}</p>
            <p className="text-sm text-gray-400 mt-1">Biens actifs</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-3xl font-bold text-orange-500">
              {properties.filter(p => p.matterport_url).length}
            </p>
            <p className="text-sm text-gray-400 mt-1">Visites 360°</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-3xl font-bold text-gray-900">
              {properties.length > 0
                ? new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(
                    properties.reduce((sum, p) => sum + p.price, 0)
                  )
                : '—'}
            </p>
            <p className="text-sm text-gray-400 mt-1">Valeur totale €</p>
          </div>
        </div>

        {/* Biens */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Mes biens</h2>
          <button
            onClick={() => { setEditProp(null); setShowForm(true) }}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            + Ajouter un bien
          </button>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">🏡</p>
            <p className="text-gray-500 mb-4">Aucun bien pour l'instant</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Ajouter mon premier bien
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {properties.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-5">
                {p.images?.[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{p.title}</h3>
                  <p className="text-sm text-gray-400">{p.location}</p>
                  <p className="text-sm font-bold text-orange-500 mt-1">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {p.matterport_url && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-medium">360°</span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                    p.status === 'active' ? 'bg-green-50 text-green-600' :
                    p.status === 'sold' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-50 text-yellow-600'
                  }`}>
                    {p.status === 'active' ? 'Actif' : p.status === 'sold' ? 'Vendu' : 'Brouillon'}
                  </span>
                  <button
                    onClick={() => { setEditProp(p); setShowForm(true) }}
                    className="text-sm text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => deleteProperty(p.id)}
                    className="text-sm text-red-400 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulaire modal */}
      {showForm && (
        <PropertyForm
          agentId={user!.id}
          property={editProp}
          onSaved={handleSaved}
          onClose={() => { setShowForm(false); setEditProp(null) }}
        />
      )}
    </main>
  )
}
