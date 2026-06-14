'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', beta: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.beta.toUpperCase() !== 'HABITEO2025') {
      setError('Code beta invalide. Contactez Eric Perniaux pour obtenir votre accès.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }

    setLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { name: form.name },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Insert agent profile
    if (data.user) {
      await supabase.from('agents').upsert({
        id: data.user.id,
        email: form.email,
        name: form.name,
      })
    }

    router.push('/dashboard')
    setLoading(false)
  }

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl">🏠</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Habiteo</h1>
          <p className="text-gray-400 text-sm mt-1">Créez votre compte agent</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Code beta */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-2">
              <label className="block text-sm font-semibold text-orange-700 mb-1">🔑 Code d'accès beta *</label>
              <input className={inp} value={form.beta} onChange={e => set('beta', e.target.value)} required placeholder="Votre code d'invitation" />
              <p className="text-xs text-orange-500 mt-1">Plateforme en accès beta — contactez Eric Perniaux pour obtenir votre code.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
              <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Jean Dupont" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email professionnel *</label>
              <input className={inp} type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="jean@safti.fr" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe *</label>
              <input className={inp} type="password" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="8 caractères minimum" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe *</label>
              <input className={inp} type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} required placeholder="Répétez le mot de passe" />
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors mt-2">
              {loading ? 'Création du compte…' : 'Créer mon compte'}
            </button>

          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-orange-500 hover:underline font-medium">Se connecter</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          En vous inscrivant, vous acceptez les conditions d'utilisation de Habiteo.
        </p>
      </div>
    </div>
  )
}
