'use client'

// Onglet « Documents » du dossier : dépôt des pièces (vendeur + bien),
// lecture automatique par Claude et compte rendu de ce qui a été rempli.

import { useRef, useState } from 'react'
import { DOC_TYPES, type DocType, type MergeReport } from '@/lib/cmi-extraction'

export type DossierDoc = {
  id: string
  file_name: string
  file_url: string
  doc_type: DocType
  mime_type: string | null
  size_bytes: number | null
  extracted: { resumo?: string } | null
  uploaded_at: string
}

const CHECKLIST_HINT = [
  'Cartão de Cidadão / passeport de chaque propriétaire (ou certidão comercial pour une société)',
  'Caderneta predial',
  'Certidão do registo predial (certidão permanente)',
  'Licença de utilização',
  'Ficha técnica da habitação',
  'Planta do imóvel',
  'Certificado energético',
]

function fmtSize(n: number | null) {
  if (!n) return ''
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} Mo` : `${Math.round(n / 1024)} Ko`
}

export default function DocumentsPanel({
  docs, uploading, analysing, report, alerts, error,
  onFiles, onDelete, onOpen, onAnalyse, onGoToMandate,
}: {
  docs: DossierDoc[]
  uploading: boolean
  analysing: boolean
  report: MergeReport | null
  alerts: string[]
  error: string
  onFiles: (files: File[]) => void
  onDelete: (doc: DossierDoc) => void
  onOpen: (doc: DossierDoc) => void
  onAnalyse: () => void
  onGoToMandate: () => void
}) {
  const [over, setOver] = useState(false)
  const [showFilled, setShowFilled] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900">Documents du dossier</h2>
        <p className="text-xs text-gray-400 mt-0.5">Glissez ici les documents du vendeur et du bien (PDF ou photos). Ils restent privés : vous seul y avez accès.</p>

        <div
          onDragOver={e => { e.preventDefault(); setOver(true) }}
          onDragLeave={() => setOver(false)}
          onDrop={e => { e.preventDefault(); setOver(false); if (e.dataTransfer.files.length) onFiles(Array.from(e.dataTransfer.files)) }}
          onClick={() => input.current?.click()}
          className={`mt-4 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${over ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
          <input ref={input} type="file" multiple accept="application/pdf,image/*" className="hidden"
            onChange={e => { if (e.target.files?.length) onFiles(Array.from(e.target.files)); e.target.value = '' }} />
          {uploading
            ? <p className="text-orange-500 font-medium">Envoi en cours…</p>
            : <>
                <p className="text-3xl mb-2">📎</p>
                <p className="text-gray-600 text-sm font-medium">Glissez les documents ici</p>
                <p className="text-gray-400 text-xs mt-1">ou cliquez pour les choisir · PDF, JPG, PNG</p>
              </>}
        </div>

        {docs.length === 0 && (
          <div className="mt-4 text-xs text-gray-400">
            <p className="font-semibold text-gray-500 mb-1">Documents attendus :</p>
            <ul className="list-disc pl-5 space-y-0.5">{CHECKLIST_HINT.map(h => <li key={h}>{h}</li>)}</ul>
          </div>
        )}

        {docs.length > 0 && (
          <ul className="mt-4 divide-y divide-gray-50">
            {docs.map(doc => (
              <li key={doc.id} className="py-2.5 flex items-center gap-3">
                <span className="text-xl">{doc.mime_type === 'application/pdf' ? '📄' : '🖼️'}</span>
                <div className="flex-1 min-w-0">
                  <button type="button" onClick={() => onOpen(doc)} className="text-sm font-medium text-gray-800 hover:text-orange-600 truncate block max-w-full text-left">{doc.file_name}</button>
                  <p className="text-xs text-gray-400 truncate">
                    {doc.doc_type !== 'a_classer' && <span className="text-orange-600 font-medium">{DOC_TYPES[doc.doc_type]} · </span>}
                    {doc.extracted?.resumo || fmtSize(doc.size_bytes)}
                  </p>
                </div>
                <button type="button" onClick={() => onDelete(doc)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50">Retirer</button>
              </li>
            ))}
          </ul>
        )}

        {docs.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={onAnalyse} disabled={analysing || uploading}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              {analysing ? '⏳ Lecture des documents… (jusqu\'à 1–2 min)' : '✨ Lire les documents et remplir le mandat'}
            </button>
            {!analysing && <p className="text-xs text-gray-400">Les champs déjà remplis à la main ne sont jamais écrasés.</p>}
          </div>
        )}
        {error && <p className="mt-3 text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
      </section>

      {report && (
        <section className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Résultat de la lecture</h2>
            <button type="button" onClick={onGoToMandate} className="text-sm text-orange-500 hover:underline font-medium">Vérifier le mandat →</button>
          </div>

          <div>
            <button type="button" onClick={() => setShowFilled(v => !v)} className="text-sm text-green-700 font-medium">
              ✅ {report.filled.length} champ{report.filled.length > 1 ? 's' : ''} rempli{report.filled.length > 1 ? 's' : ''} automatiquement {report.filled.length > 0 && (showFilled ? '▾' : '▸')}
            </button>
            {showFilled && (
              <ul className="mt-2 text-xs text-gray-500 grid grid-cols-2 gap-x-6 gap-y-1">
                {report.filled.map((f, i) => <li key={i}>{f.field} <span className="text-gray-300">← {f.source}</span></li>)}
              </ul>
            )}
          </div>

          {(report.conflicts.length > 0 || alerts.length > 0) && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-2">⚠️ À vérifier</p>
              <ul className="text-sm text-amber-800 space-y-1 list-disc pl-5">
                {report.conflicts.map((c, i) => (
                  <li key={`c${i}`}>{c.field} : vous avez saisi « {c.current} », le document {c.source && `(${c.source}) `}indique « {c.found} ».</li>
                ))}
                {alerts.map((a, i) => <li key={`a${i}`}>{a}</li>)}
              </ul>
            </div>
          )}
          <p className="text-xs text-gray-400">La lecture automatique peut se tromper : relisez chaque champ du mandat avant de le faire signer.</p>
        </section>
      )}
    </div>
  )
}
