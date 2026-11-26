'use client'

// Contrat imprimable. Avant d'imprimer, l'agent peut corriger ou compléter
// le texte directement sur la page ; la version corrigée est enregistrée
// dans le dossier (data.contratEditado) et peut être abandonnée à tout moment.

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { withDefaults, ownersLabel, missingFields, CMI_TYPES, type CmiData, type CmiType } from '@/lib/cmi'
import CmiDocument, { CMI_DOC_CSS } from '../../CmiDocument'

/** Retire scripts et attributs d'événements d'un HTML édité à la main. */
function cleanHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\scontenteditable="[^"]*"/gi, '')
}

export default function CmiPrintPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [state, setState] = useState<{ d: CmiData; type: CmiType; updatedAt: string | null } | null>(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const docRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: m, error } = await supabase.from('property_mandates').select('contract_type,data,updated_at').eq('id', id).single()
      if (error || !m) { setError('Contrat introuvable.'); return }
      const d = withDefaults(m.data)
      setState({ d, type: m.contract_type, updatedAt: m.updated_at })
      // Nom proposé pour le fichier PDF
      document.title = `CMI ${CMI_TYPES[m.contract_type as CmiType].pt} - ${ownersLabel(d) || 'sans nom'}`
    })()
  }, [id, router])

  async function storeEdited(contratEditado: CmiData['contratEditado']) {
    if (!state) return
    setSaving(true)
    const d = { ...state.d, contratEditado }
    // updated_at n'est pas touché : il sert à repérer un formulaire modifié après la correction
    const { error } = await supabase.from('property_mandates').update({ data: d }).eq('id', id)
    setSaving(false)
    if (error) { alert('Erreur : ' + error.message); return }
    setState({ ...state, d })
  }

  async function saveEdits() {
    if (!docRef.current) return
    await storeEdited({ html: cleanHtml(docRef.current.innerHTML), at: new Date().toISOString() })
    setEditing(false)
  }

  async function discardEdits() {
    if (!confirm('Abandonner les corrections faites à la main et revenir au contrat généré depuis le formulaire ?')) return
    await storeEdited(undefined)
  }

  const edited = state?.d.contratEditado
  const formChangedSince = edited && state?.updatedAt && new Date(state.updatedAt).getTime() > new Date(edited.at).getTime() + 2000
  const missing = state ? missingFields(state.d) : []

  return (
    <main className="min-h-screen bg-gray-100 py-6">
      <style>{CMI_DOC_CSS}</style>
      <div className="no-print max-w-[210mm] mx-auto mb-4 px-2 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/dashboard/bien/${id}`} className="text-sm text-gray-500 hover:text-gray-800">← Retour au dossier</Link>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)} className="text-sm text-gray-500 hover:text-gray-800 px-3 py-2">Annuler</button>
                <button onClick={saveEdits} disabled={saving}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                  {saving ? 'Enregistrement…' : '✅ Enregistrer les corrections'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} disabled={!state}
                  className="text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                  ✏️ Corriger le texte
                </button>
                <button onClick={() => window.print()} disabled={!state}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                  🖨️ Imprimer / PDF
                </button>
              </>
            )}
          </div>
        </div>

        {editing && (
          <p className="text-sm bg-blue-50 border border-blue-100 text-blue-800 rounded-xl px-4 py-3">
            ✏️ Cliquez n&apos;importe où dans le contrat pour corriger ou ajouter du texte (une clause, un téléphone, une mention…), puis « Enregistrer les corrections ».
            Pour une information qui doit aussi rester dans le dossier, mieux vaut la saisir dans le formulaire du mandat.
          </p>
        )}
        {!editing && edited && (
          <div className={`text-sm rounded-xl px-4 py-3 flex items-center justify-between gap-3 border ${formChangedSince ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
            <span>
              {formChangedSince
                ? '⚠️ Le formulaire a été modifié après vos corrections : ces changements n\'apparaissent pas dans ce contrat.'
                : `✏️ Ce contrat contient des corrections faites à la main le ${new Date(edited.at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}.`}
            </span>
            <button onClick={discardEdits} className="text-xs font-semibold underline whitespace-nowrap">Revenir au contrat du formulaire</button>
          </div>
        )}
        {!editing && missing.length > 0 && (
          <div className="text-sm bg-amber-50 border border-amber-100 text-amber-800 rounded-xl px-4 py-3">
            📋 Il manque encore : {missing.map(m => m.label).join(', ')}.{' '}
            <Link href={`/dashboard/bien/${id}`} className="font-semibold underline">Compléter le mandat</Link>
            {' '}— ou laissez les pointillés pour remplir à la main.
          </div>
        )}
        <p className="text-xs text-gray-400">Pour un PDF : « Imprimer », puis « Enregistrer au format PDF ». Dans la fenêtre d&apos;impression, gardez les marges sur « Aucune » / « Par défaut » et l&apos;échelle à 100 %.</p>
      </div>

      {error && <p className="text-center text-red-500">{error}</p>}
      {!state && !error && <p className="text-center text-gray-400">Chargement…</p>}
      {state && (
        <div ref={docRef} key={`${editing}-${edited?.at || 'gen'}`}
          contentEditable={editing} suppressContentEditableWarning
          className={editing ? 'cmi-editing' : undefined}
          {...(edited ? { dangerouslySetInnerHTML: { __html: edited.html } } : {})}>
          {edited ? undefined : <CmiDocument d={state.d} type={state.type} />}
        </div>
      )}
    </main>
  )
}
