'use client'

import { useEffect, useRef, useState } from 'react'
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
  const [uploadingCount, setUploadingCount] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [validating, setValidating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('property_documents').select('*').eq('property_id', property.id).order('uploaded_at', { ascending: false })
      .then(({ data }) => {
        setDocuments(data || [])
        setLoading(false)
      })
  }, [property.id])

  async function classifyFile(file: File): Promise<PropertyDocumentType> {
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/classify-document', { method: 'POST', body })
      const data = await res.json()
      return (data.docType as PropertyDocumentType) || 'outro'
    } catch {
      return 'outro'
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files)
    setError('')
    for (const file of list) {
      setUploadingCount(c => c + 1)
      try {
        const docType = await classifyFile(file)
        const ext = file.name.split('.').pop()
        const path = `${agentId}/${property.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadError } = await supabase.storage.from('property-documents').upload(path, file)
        if (uploadError) { setError(uploadError.message); continue }
        const { data, error: insertError } = await supabase.from('property_documents')
          .insert({ property_id: property.id, agent_id: agentId, doc_type: docType, file_name: file.name, file_url: path })
          .select().single()
        if (insertError) { setError(insertError.message); continue }
        setDocuments(prev => [data as PropertyDocument, ...prev])
      } finally {
        setUploadingCount(c => c - 1)
      }
    }
  }

  async function handleTypeChange(doc: PropertyDocument, docType: PropertyDocumentType) {
    const { data, error: updateError } = await supabase.from('property_documents').update({ doc_type: docType }).eq('id', doc.id).select().single()
    if (updateError) { setError(updateError.message); return }
    setDocuments(prev => prev.map(d => d.id === doc.id ? (data as PropertyDocument) : d))
  }

  async function handleDelete(doc: PropertyDocument) {
    if (!confirm('Supprimer ce document ?')) return
    await supabase.storage.from('property-documents').remove([doc.file_url])
    await supabase.from('property_documents').delete().eq('id', doc.id)
    setDocuments(prev => prev.filter(d => d.id !== doc.id))
  }

  async function handleView(doc: PropertyDocument) {
    const { data, error: signError } = await supabase.storage.from('property-documents').createSignedUrl(doc.file_url, 300)
    if (signError || !data) { setError(signError?.message || "Impossible d'ouvrir le document"); return }
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

          {/* Dépôt de documents */}
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Documents officiels</p>
            <div
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files) }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={e => e.target.files?.length && handleFiles(e.target.files)}
              />
              {uploadingCount > 0 ? (
                <p className="text-orange-500 font-medium text-sm">⏳ Analyse et envoi en cours…</p>
              ) : (
                <>
                  <p className="text-2xl mb-1">📄</p>
                  <p className="text-gray-500 text-sm font-medium">Glissez vos documents ici (ou photographiez-les)</p>
                  <p className="text-gray-400 text-xs mt-1">Le type (Caderneta, Certificado Energético...) est détecté automatiquement</p>
                </>
              )}
            </div>
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
                <div key={doc.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-4 py-2.5 gap-2">
                  <div className="min-w-0 flex-1">
                    <select
                      value={doc.doc_type}
                      onChange={e => handleTypeChange(doc, e.target.value as PropertyDocumentType)}
                      className="text-sm font-medium text-gray-900 bg-transparent border-none focus:outline-none -ml-1 cursor-pointer"
                    >
                      {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
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
