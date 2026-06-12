'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [poweredBy, setPoweredBy] = useState('')
  const [bio, setBio] = useState('')
  const [poweredByLoading, setPoweredByLoading] = useState(false)
  const [poweredBySuccess, setPoweredBySuccess] = useState(false)
  const [bioLoading, setBioLoading] = useState(false)
  const [bioSuccess, setBioSuccess] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUserId(user.id)
      supabase.from('profiles').select('powered_by, bio').eq('id', user.id).single()
        .then(({ data }) => {
          if (data?.powered_by) setPoweredBy(data.powered_by)
          if (data?.bio) setBio(data.bio)
        })
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    if (password.length < 8) { setError('Le mot de passe doit faire au moins 8 caractères.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else { setSuccess(true); setPassword(''); setConfirm('') }
    setLoading(false)
  }

  async function savePoweredBy() {
    if (!userId) return
    setPoweredByLoading(true)
    setPoweredBySuccess(false)
    await supabase.from('profiles').upsert({ id: userId, powered_by: poweredBy })
    setPoweredByLoading(false)
    setPoweredBySuccess(true)
    setTimeout(() => setPoweredBySuccess(false), 3000)
  }

  async function saveBio() {
    if (!userId) return
    setBioLoading(true)
    setBioSuccess(false)
    await supabase.from('profiles').upsert({ id: userId, bio })
    setBioLoading(false)
    setBioSuccess(true)
    setTimeout(() => setBioSuccess(false), 3000)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
        <h1 className="font-bold text-gray-900">Paramètres du compte</h1>
      </header>

      <div className="max-w-md mx-auto px-6 py-10 flex flex-col gap-6">

        {/* Bio */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Présentation</h2>
          <p className="text-xs text-gray-400 mb-5">Texte affiché sous votre nom sur la page publique</p>
          {bioSuccess && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-4 font-medium text-sm">✅ Enregistré !</div>
          )}
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            placeholder="Mandataire immobilier spécialisé en Algarve…"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 resize-none mb-3"
          />
          <button
            onClick={saveBio}
            disabled={bioLoading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
          >
            {bioLoading ? '…' : 'Sauvegarder'}
          </button>
        </div>

        {/* Texte "Powered by" */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Texte sous votre nom</h2>
          <p className="text-xs text-gray-400 mb-5">Affiché en petit sous "Eric Perniaux" sur votre page publique</p>
          {poweredBySuccess && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-4 font-medium text-sm">
              ✅ Enregistré !
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={poweredBy}
              onChange={e => setPoweredBy(e.target.value)}
              placeholder="Powered by SAFTI"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
            />
            <button
              onClick={savePoweredBy}
              disabled={poweredByLoading}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
            >
              {poweredByLoading ? '…' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        {/* Changer mot de passe */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Changer le mot de passe</h2>

          {success && (
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl mb-6 font-medium">
              ✅ Mot de passe modifié avec succès !
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Minimum 8 caractères"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder="Répétez le mot de passe"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Enregistrement…' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
