'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Property, PropertyDocument, PropertyDocumentType } from '@/lib/types'

type Props = {
  agentId: string
  property: Property
  onStatusChange: (p: Property) => void
  onClose: () => void
}

const DOC_TYPES: { value: PropertyDocumentType; label: string; required: boolean }[] = [
  { value: 'caderneta_predial', label: 'Caderneta Predial', required: true },
  { value: 'certificado_energetico', label: 'Certificado Energético', required: true },
  { value: 'certidao_registo_predial', label: 'Certidão de Registo Predial', required: false },
  { value: 'licenca_utilizacao', label: 'Licença de Utilização', required: false },
  { value: 'outro', label: 'Autre document', required: false },
]

export default function PropertyDocumentsPanel({ agentId, property, onStatusChange, onClose }: Props) {
  const [documents, setDocuments] = useState<PropertyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState<PropertyDocumentType>('caderneta_predial')
  const [error, setError] = useState('')
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    supabase.from('property_documents').select('*').eq('property_id', property.id).order('uploaded_at', { ascending: false })
      .then(({ data }) => {
        setDocuments(data || [])
        setLoading(false)
      })
  }, [property.id])

  async function handleUpload(file: File) {
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `${agentId}/${property.id}/${Date.now()}-${docType}.${ext}`
      const { error: uploadError } = await supabase.storage.from('property-documents').upload(path, file)
      if (uploadError) { setError(uploadError.message); return }
      const { data, error: insertError } = await supabase.from('property_documents')
        .insert({ property_id: property.id, agent_id: agentId, doc_type: docType, file_name: file.name, file_url: path })
        .select().single()
      if (insertError) { setError(insertError.message); return }
      setDocuments(prev => [data as PropertyDocument, ...prev])
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(doc: PropertyDocument) {
    if (!confirm('Supprimer ce document ?')) return
    await supabase.storage.from('property-documents').remove([doc.file_url])
    await supabase.from('property_documents').delete().eq('id', doc.id)
    setDocuments(prev => prev.filter(d => d.id !== doc.id))
  }

  async function handleView(doc: PropertyDocument) {
    const { data, error: signError } = await supabase.storage.from('property-documents').createSignedUrl(doc.file_url, 300)
    if (signError || !data) { setError(signError?.message || 'Impossible d\'ouvrir le document'); return }
    window.open(data.signedUrl, '_blank')
  }

  const hasPhotos = (property.images?.length || 0) > 0
  const hasDescription = !!property.description?.trim()
  const requiredDocs = DOC_TYPES.filter(d => d.required)
  const missingDocs = requiredDocs.filter(rd => !documents.some(d => d.doc_type === rd.value))
  const isComplete = hasPhotos && hasDescription && missingDocs.length === 0

  async function handleValidate() {
    setValidating(true)
    setError('')
    const { data, error: updateError } = await supabase.from('properties').update({ status: 'active' }).eq('id', property.id).select().single()
    setValidating(false)
    if (updateError) { setError(updateError.message); return }
    onStatusChange(data as Property)
  }

  async function handleUnpublish() {
    setValidating(true)
    setError('')
    const { data, error: updateError } = await supabase.from('properties').update({ status: 'draft' }).eq('id', property.id).select().single()
    setValidating(false)
    if (updateError) { setError(updateError.message); return }
    onStatusChange(data as Property)
  }

  const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 transition-colors"

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Documents & validation — {property.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="p-6 flex flex-col gap-5">
          {/* Checklist */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Avant publication</p>
            <div className="flex flex-col gap-2 text-sm">
              <ChecklistRow ok={hasPhotos} label="Au moins une photo" />
              <ChecklistRow ok={hasDescription} label="Description renseignée" />
              {requiredDocs.map(rd => (
                <ChecklistRow key={rd.value} ok={documents.some(d => d.doc_type === rd.value)} label={rd.label} />
              ))}
            </div>
          </div>

          {property.status === 'active' ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
              <p className="text-sm text-green-700 font-medium">✅ Publié — visible sur le site public</p>
              <button onClick={handleUnpublish} disabled={validating} className="text-xs text-gray-500 hover:text-gray-700 underline disabled:opacity-50">
                Remettre en prospection
              </button>
            </div>
          ) : (
            <button
              onClick={handleValidate}
              disabled={!isComplete || validating}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {validating ? 'Publication…' : isComplete ? '✓ Valider et publier' : `En prospection — ${[!hasPhotos && 'photos', !hasDescription && 'description', ...missingDocs.map(d => d.label)].filter(Boolean).join(', ')} manquant(s)`}
            </button>
          )}

          {/* Upload */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ajouter un document</p>
            <div className="flex gap-2">
              <select className={inp} value={docType} onChange={e => setDocType(e.target.value as PropertyDocumentType)}>
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <label className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm whitespace-nowrap cursor-pointer">
                {uploading ? '⏳…' : '+ Fichier'}
                <input type="file" accept="application/pdf,image/*" capture="environment" className="hidden" disabled={uploading}
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-2">Sur mobile, tu peux prendre le document en photo directement.</p>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

          {/* Liste */}
          <div className="flex flex-col gap-2">
            {loading ? (
              <p className="text-sm text-gray-400">Chargement…</p>
            ) : documents.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun document déposé pour l&apos;instant.</p>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{DOC_TYPES.find(t => t.value === doc.doc_type)?.label}</p>
                    <p className="text-xs text-gray-400 truncate">{doc.file_name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleView(doc)} className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-50">Voir</button>
                    <button onClick={() => handleDelete(doc)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50">Supprimer</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ChecklistRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={ok ? 'text-green-500' : 'text-gray-300'}>{ok ? '✓' : '○'}</span>
      <span className={ok ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
    </div>
  )
}
