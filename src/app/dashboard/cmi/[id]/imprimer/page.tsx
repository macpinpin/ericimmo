'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { withDefaults, ownersLabel, CMI_TYPES, type CmiData, type CmiType } from '@/lib/cmi'
import CmiDocument, { CMI_DOC_CSS } from '../../CmiDocument'

export default function CmiPrintPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [state, setState] = useState<{ d: CmiData; type: CmiType } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: m, error } = await supabase.from('property_mandates').select('contract_type,data').eq('id', id).single()
      if (error || !m) { setError('Contrat introuvable.'); return }
      const d = withDefaults(m.data)
      setState({ d, type: m.contract_type })
      // Nom proposé pour le fichier PDF
      document.title = `CMI ${CMI_TYPES[m.contract_type as CmiType].pt} - ${ownersLabel(d) || 'sans nom'}`
    })()
  }, [id, router])

  return (
    <main className="min-h-screen bg-gray-100 py-6">
      <style>{CMI_DOC_CSS}</style>
      <div className="no-print max-w-[210mm] mx-auto mb-4 flex items-center justify-between gap-3 px-2">
        <Link href={`/dashboard/cmi/${id}`} className="text-sm text-gray-500 hover:text-gray-800">← Modifier le contrat</Link>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-400 hidden sm:block">Pour un PDF : « Imprimer » puis « Enregistrer au format PDF »</p>
          <button onClick={() => window.print()} disabled={!state}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            🖨️ Imprimer / PDF
          </button>
        </div>
      </div>
      {error && <p className="text-center text-red-500">{error}</p>}
      {!state && !error && <p className="text-center text-gray-400">Chargement…</p>}
      {state && <CmiDocument d={state.d} type={state.type} />}
    </main>
  )
}
