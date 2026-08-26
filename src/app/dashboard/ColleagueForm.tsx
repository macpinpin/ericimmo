'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Colleague, Property } from '@/lib/types'
import { getDistricts } from '@/lib/portugal'

type Props = {
  agentId: string
  colleague: Colleague | null
  properties: Property[]
  onSaved: (c: Colleague) => void
  onClose: () => void
}

const TITLES = ['Agent', 'Employé', 'Responsable', 'Directeur', 'Autre']
const SPECIALTIES = ['Résidentiel', 'Commercial', 'Luxe', 'Terrain', 'Location', 'Investissement', 'Autre']

export default function ColleagueForm({ agentId, colleague, properties, onSaved, onClose }: Props) {
  const [form, setForm] = useState({
    first_name: colleague?.first_name || '',
    last_name: colleague?.last_name || '',
    title: colleague?.title || '',
    agency: colleague?.agency || '',
    phone: colleague?.phone || '',
    email: colleague?.email || '',
    district: colleague?.district || '',
    specialty: colleague?.specialty || '',
    property_id: colleague?.property_id || '',
    notes: colleague?.notes || '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      agent_id: agentId,
      first_name: form.first_name,
      last_name: form.last_name,
      title: form.title || null,
      agency: form.agency || null,
      phone: form.phone || null,
      email: form.email || null,
      district: form.district || null,
      specialty: form.specialty || null,
      property_id: form.property_id || null,
      notes: form.notes || null,
    }

    let result
    if (colleague) {
      result = await supabase.from('colleagues').update(payload).eq('id', colleague.id).select().single()
    } else {
      result = await supabase.from('colleagues').insert(payload).select().single()
    }

    if (result.error) setError(result.error.message)
    else onSaved(result.data as Colleague)
    setLoading(false)
  }

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"
  const lbl = "block text-sm font-medium text-gray-700 mb-1"
  const section = "text-xs font-bold text-gray-400 uppercase tracking-widest mt-5 mb-3"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {colleague ? 'Modifier le collègue' : 'Ajouter un collègue / agent'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">

          <p className={section}>Identité</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Prénom *</label>
              <input className={inp} value={form.first_name} onChange={e => set('first_name', e.target.value)} required placeholder="Jean" />
            </div>
            <div>
              <label className={lbl}>Nom *</label>
              <input className={inp} value={form.last_name} onChange={e => set('last_name', e.target.value)} required placeholder="Dupont" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Titre</label>
              <select className={inp} value={form.title} onChange={e => set('title', e.target.value)}>
                <option value="">—</option>
                {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Agence / Réseau</label>
              <input className={inp} value={form.agency} onChange={e => set('agency', e.target.value)} placeholder="SAFTI, IAD, Indépendant..." />
            </div>
          </div>

          <p className={section}>Coordonnées</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Téléphone / WhatsApp</label>
              <input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+351 91 000 00 00" />
            </div>
            <div>
              <label className={lbl}>Email</label>
              <input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jean@agence.com" />
            </div>
          </div>

          <p className={section}>Activité</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Zone de travail</label>
              <select className={inp} value={form.district} onChange={e => set('district', e.target.value)}>
                <option value="">— Tous —</option>
                {getDistricts().map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Spécialité</label>
              <select className={inp} value={form.specialty} onChange={e => set('specialty', e.target.value)}>
                <option value="">—</option>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Propriété concernée</label>
            <select className={inp} value={form.property_id} onChange={e => set('property_id', e.target.value)}>
              <option value="">— Aucune —</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.ref ? `[${p.ref}] ` : ''}{p.title} — {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(p.price)}</option>
              ))}
            </select>
          </div>

          <p className={section}>Notes</p>
          <textarea className={`${inp} resize-none`} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Informations complémentaires..." />

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'Enregistrement…' : colleague ? 'Enregistrer' : 'Ajouter le collègue'}
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
