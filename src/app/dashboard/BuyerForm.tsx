'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Buyer } from '@/lib/types'
import { getDistricts, getConcelhos, getFreguesias } from '@/lib/portugal'

type Props = {
  agentId: string
  buyer: Buyer | null
  onSaved: (b: Buyer) => void
  onClose: () => void
}

const SOURCES = ['Site web', 'WhatsApp', 'SAFTI', 'Bouche-à-oreille', 'Réseaux sociaux', 'Portail immobilier', 'Autre']
const NATIONALITIES = ['Portugaise', 'Française', 'Britannique', 'Allemande', 'Néerlandaise', 'Belge', 'Suisse', 'Américaine', 'Brésilienne', 'Chinoise', 'Autre']

export default function BuyerForm({ agentId, buyer, onSaved, onClose }: Props) {
  const [form, setForm] = useState({
    name: buyer?.name || '',
    email: buyer?.email || '',
    phone: buyer?.phone || '',
    nationality: buyer?.nationality || '',
    birthday: buyer?.birthday || '',
    source: buyer?.source || '',
    property_type: buyer?.property_type || '',
    budget_min: buyer?.budget_min?.toString() || '',
    budget_max: buyer?.budget_max?.toString() || '',
    bedrooms_min: buyer?.bedrooms_min?.toString() || '',
    district: buyer?.district || '',
    concelho: buyer?.concelho || '',
    freguesia: buyer?.freguesia || '',
    area_min: buyer?.area_min?.toString() || '',
    area_max: buyer?.area_max?.toString() || '',
    status: buyer?.status || 'cold',
    notes: buyer?.notes || '',
    first_contact: buyer?.first_contact || new Date().toISOString().split('T')[0],
    last_contact: buyer?.last_contact || new Date().toISOString().split('T')[0],
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
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      nationality: form.nationality || null,
      birthday: form.birthday || null,
      source: form.source || null,
      property_type: form.property_type || null,
      budget_min: form.budget_min ? parseFloat(form.budget_min) : null,
      budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
      bedrooms_min: form.bedrooms_min ? parseInt(form.bedrooms_min) : null,
      district: form.district || null,
      concelho: form.concelho || null,
      freguesia: form.freguesia || null,
      area_min: form.area_min ? parseFloat(form.area_min) : null,
      area_max: form.area_max ? parseFloat(form.area_max) : null,
      status: form.status,
      notes: form.notes || null,
      first_contact: form.first_contact || null,
      last_contact: form.last_contact || null,
    }

    let result
    if (buyer) {
      result = await supabase.from('buyers').update(payload).eq('id', buyer.id).select().single()
    } else {
      result = await supabase.from('buyers').insert(payload).select().single()
    }

    if (result.error) setError(result.error.message)
    else onSaved(result.data as Buyer)
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
            {buyer ? 'Modifier l\'acheteur' : 'Ajouter un acheteur'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">

          {/* Statut */}
          <div>
            <label className={lbl}>Statut du prospect *</label>
            <div className="flex gap-3">
              {[
                { value: 'hot', label: '🔴 Chaud', bg: 'bg-red-50 border-red-300 text-red-700' },
                { value: 'warm', label: '🟡 Tiède', bg: 'bg-yellow-50 border-yellow-300 text-yellow-700' },
                { value: 'cold', label: '🔵 Froid', bg: 'bg-blue-50 border-blue-300 text-blue-700' },
              ].map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set('status', s.value)}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${form.status === s.value ? s.bg + ' border-2' : 'border-gray-200 text-gray-400'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coordonnées */}
          <p className={section}>Coordonnées</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Nom complet *</label>
              <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Jean Dupont" />
            </div>
            <div>
              <label className={lbl}>Nationalité</label>
              <select className={inp} value={form.nationality} onChange={e => set('nationality', e.target.value)}>
                <option value="">—</option>
                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Email</label>
              <input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jean@exemple.com" />
            </div>
            <div>
              <label className={lbl}>Téléphone / WhatsApp</label>
              <input className={inp} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+33 6 00 00 00 00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Date de naissance</label>
              <input className={inp} type="date" value={form.birthday} onChange={e => set('birthday', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Source</label>
              <select className={inp} value={form.source} onChange={e => set('source', e.target.value)}>
                <option value="">—</option>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>1er contact</label>
              <input className={inp} type="date" value={form.first_contact} onChange={e => set('first_contact', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Dernier contact</label>
              <input className={inp} type="date" value={form.last_contact} onChange={e => set('last_contact', e.target.value)} />
            </div>
          </div>

          {/* Projet */}
          <p className={section}>Projet immobilier</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Type de bien</label>
              <select className={inp} value={form.property_type} onChange={e => set('property_type', e.target.value)}>
                <option value="">—</option>
                <option value="villa">Villa / Maison</option>
                <option value="apartment">Appartement</option>
                <option value="land">Terrain</option>
                <option value="commercial">Commercial</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Chambres minimum</label>
              <select className={inp} value={form.bedrooms_min} onChange={e => set('bedrooms_min', e.target.value)}>
                <option value="">—</option>
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Budget min (€)</label>
              <input className={inp} type="number" value={form.budget_min} onChange={e => set('budget_min', e.target.value)} placeholder="100 000" />
            </div>
            <div>
              <label className={lbl}>Budget max (€)</label>
              <input className={inp} type="number" value={form.budget_max} onChange={e => set('budget_max', e.target.value)} placeholder="500 000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Surface min (m²)</label>
              <input className={inp} type="number" value={form.area_min} onChange={e => set('area_min', e.target.value)} placeholder="100" />
            </div>
            <div>
              <label className={lbl}>Surface max (m²)</label>
              <input className={inp} type="number" value={form.area_max} onChange={e => set('area_max', e.target.value)} placeholder="300" />
            </div>
          </div>

          {/* Localisation souhaitée */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={lbl}>District</label>
              <select className={inp} value={form.district} onChange={e => { set('district', e.target.value); set('concelho', ''); set('freguesia', '') }}>
                <option value="">— Tous —</option>
                {getDistricts().map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Concelho</label>
              <select className={inp} value={form.concelho} onChange={e => { set('concelho', e.target.value); set('freguesia', '') }} disabled={!form.district}>
                <option value="">— Tous —</option>
                {getConcelhos(form.district).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Freguesia</label>
              <select className={inp} value={form.freguesia} onChange={e => set('freguesia', e.target.value)} disabled={!form.district}>
                <option value="">— Toutes —</option>
                {getFreguesias(form.district, form.concelho).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <p className={section}>Notes</p>
          <textarea className={`${inp} resize-none`} rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Informations complémentaires, remarques..." />

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              {loading ? 'Enregistrement…' : buyer ? 'Enregistrer' : 'Ajouter l\'acheteur'}
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
