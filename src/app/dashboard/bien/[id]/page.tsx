'use client'

// Dossier d'un bien : tout l'angariação au même endroit.
//   1. Documents  – dépôt des pièces + lecture automatique
//   2. Mandat     – contrat de médiation (CMI), imprimable
//   3. Annonce    – fiche publiée sur le site
// L'id de l'URL est celui du mandat (« nouveau » pour un nouveau dossier).

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Property } from '@/lib/types'
import { getDistricts, getConcelhos, getFreguesias } from '@/lib/portugal'
import {
  CMI_STATUS, withDefaults, summaryColumns, ownersLabel, parseAmount,
  type CmiData, type CmiType, type CmiStatus,
} from '@/lib/cmi'
import { mergeExtraction, type Extraction, type MergeReport } from '@/lib/cmi-extraction'
import CmiForm from '../CmiForm'
import DocumentsPanel, { type DossierDoc } from '../DocumentsPanel'
import PropertyForm, { type PropertyPrefill } from '../../PropertyForm'

type Tab = 'documents' | 'mandat' | 'annonce'

const IMAGE_OK = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PDF = 15 * 1024 * 1024

/** Réduit les photos (téléphone) à 2400 px en JPEG pour la lecture et le stockage. */
async function prepareFile(file: File): Promise<File> {
  if (file.type === 'application/pdf') {
    if (file.size > MAX_PDF) throw new Error(`« ${file.name} » dépasse 15 Mo`)
    return file
  }
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
    throw new Error(`« ${file.name} » : format non pris en charge (PDF ou photo uniquement)`)
  }
  let bitmap: ImageBitmap
  try { bitmap = await createImageBitmap(file) } catch {
    throw new Error(`« ${file.name} » : impossible d'ouvrir cette photo (format HEIC ?). Exportez-la en JPEG.`)
  }
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height))
  if (scale === 1 && IMAGE_OK.includes(file.type) && file.size < 3 * 1024 * 1024) return file
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/jpeg', 0.85))
  if (!blob) throw new Error(`« ${file.name} » : conversion impossible`)
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Valeurs de l'annonce déduites du mandat (prix, lieu, surface, type). */
function prefillFromCmi(d: CmiData): PropertyPrefill {
  const im = d.imovel
  const out: PropertyPrefill = {}
  const price = parseAmount(d.preco)
  if (price) out.price = String(price)
  if (im.area) out.area_bruta_privativa = String(parseAmount(im.area) ?? '')
  if (im.destino === 'fracao') out.type = 'apartment'
  else if (im.destino === 'predio') out.type = 'villa'
  else if (im.destino === 'comercial') out.type = 'commercial'
  if (im.concelho) {
    for (const district of getDistricts()) {
      const concelho = getConcelhos(district).find(c => norm(c) === norm(im.concelho))
      if (!concelho) continue
      out.district = district
      out.concelho = concelho
      const freguesia = im.freguesia && getFreguesias(district, concelho).find(f => norm(f).includes(norm(im.freguesia)) || norm(im.freguesia).includes(norm(f)))
      if (freguesia) out.freguesia = freguesia
      out.location = [concelho, district === 'Faro' ? 'Algarve' : district].join(', ')
      break
    }
  }
  return out
}

export default function DossierPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [mandateId, setMandateId] = useState<string | null>(id === 'nouveau' ? null : id)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>(id === 'nouveau' ? 'documents' : 'mandat')

  const [type, setType] = useState<CmiType>('exclusivo')
  const [status, setStatus] = useState<CmiStatus>('draft')
  const [d, setD] = useState<CmiData>(withDefaults(null))
  const [propertyId, setPropertyId] = useState<string | null>(null)
  const [property, setProperty] = useState<Property | null>(null)

  const [docs, setDocs] = useState<DossierDoc[]>([])
  const [uploading, setUploading] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [docError, setDocError] = useState('')

  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: agent } = await supabase.from('agents').select('name').eq('id', user.id).single()
      if (id === 'nouveau') {
        setD(withDefaults(null, agent?.name || ''))
      } else {
        const { data: m, error } = await supabase.from('property_mandates').select('*').eq('id', id).single()
        if (error || !m) { setError('Dossier introuvable.'); setLoading(false); return }
        setType(m.contract_type)
        setStatus(m.status)
        setD(withDefaults(m.data, agent?.name || ''))
        setPropertyId(m.property_id)
        if (m.property_id) {
          const { data: p } = await supabase.from('properties').select('*').eq('id', m.property_id).single()
          if (p) setProperty(p as Property)
        }
        const { data: files } = await supabase.from('property_documents').select('*').eq('mandate_id', id).order('uploaded_at')
        setDocs((files || []) as DossierDoc[])
      }
      setLoading(false)
    })()
  }, [id, router])

  const up = (fn: (x: CmiData) => void) => setD(prev => { const next = structuredClone(prev); fn(next); return next })

  function row(data: CmiData) {
    return {
      agent_id: userId!,
      contract_type: type,
      status,
      data,
      signed_at: status === 'signed' ? (data.data || new Date().toISOString().slice(0, 10)) : null,
      updated_at: new Date().toISOString(),
      ...summaryColumns(data),
    }
  }

  /** Enregistre le mandat (le crée au premier enregistrement) et renvoie son id. */
  async function save(data: CmiData = d): Promise<string | null> {
    if (!userId) return null
    setSaving(true)
    setError('')
    const res = mandateId
      ? await supabase.from('property_mandates').update(row(data)).eq('id', mandateId).select('id').single()
      : await supabase.from('property_mandates').insert(row(data)).select('id').single()
    setSaving(false)
    if (res.error) { setError('Erreur à l\'enregistrement : ' + res.error.message); return null }
    if (!mandateId) {
      setMandateId(res.data.id)
      // Met l'adresse de la page à jour sans recharger (les envois en cours continuent)
      window.history.replaceState(null, '', `/dashboard/bien/${res.data.id}`)
    }
    setSavedAt(new Date())
    return res.data.id
  }

  async function uploadFiles(files: File[]) {
    setDocError('')
    const mid = mandateId || await save()
    if (!mid || !userId) return
    setUploading(true)
    const errors: string[] = []
    for (const original of files) {
      try {
        const file = await prepareFile(original)
        const safe = file.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9._-]+/g, '_')
        const path = `${userId}/${mid}/${Date.now()}-${safe}`
        const { error: upError } = await supabase.storage.from('property-documents').upload(path, file, { contentType: file.type })
        if (upError) throw new Error(`« ${original.name} » : ${upError.message}`)
        const { data: doc, error: dbError } = await supabase.from('property_documents').insert({
          agent_id: userId, mandate_id: mid, property_id: propertyId, doc_type: 'a_classer',
          file_name: original.name, file_url: path, mime_type: file.type, size_bytes: file.size,
        }).select().single()
        if (dbError) throw new Error(`« ${original.name} » : ${dbError.message}`)
        setDocs(prev => [...prev, doc as DossierDoc])
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e))
      }
    }
    setUploading(false)
    if (errors.length) setDocError(errors.join(' · '))
  }

  async function deleteDoc(doc: DossierDoc) {
    if (!confirm(`Retirer « ${doc.file_name} » du dossier ?`)) return
    await supabase.storage.from('property-documents').remove([doc.file_url])
    await supabase.from('property_documents').delete().eq('id', doc.id)
    setDocs(prev => prev.filter(x => x.id !== doc.id))
  }

  async function openDoc(doc: DossierDoc) {
    const { data } = await supabase.storage.from('property-documents').createSignedUrl(doc.file_url, 300)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function analyse() {
    if (!mandateId) return
    setAnalysing(true)
    setDocError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/extract-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ mandateId }),
      })
      const text = await res.text()
      let json: { error?: string; extraction?: Extraction; documents?: { id: string; file_name: string }[] }
      try { json = JSON.parse(text) } catch { throw new Error(res.status === 504 ? 'La lecture a pris trop de temps. Réessayez avec moins de documents.' : `Erreur serveur (${res.status})`) }
      if (!res.ok || !json.extraction) throw new Error(json.error || `Erreur ${res.status}`)
      const ex = json.extraction
      const names = json.documents || []
      const docName = (i: number | null | undefined) => (i && names[i - 1]?.file_name) || ''
      const { data: merged, report } = mergeExtraction(d, ex, docName)
      merged.lecture = { at: new Date().toISOString(), filled: report.filled, conflicts: report.conflicts, alertas: ex.alertas }
      setD(merged)
      // Types et résumés détectés
      setDocs(prev => prev.map((doc) => {
        const idx = names.findIndex(n => n.id === doc.id)
        const found = ex.documentos.find(x => x.indice === idx + 1)
        return found ? { ...doc, doc_type: found.tipo, extracted: { resumo: found.resumo } } : doc
      }))
      await save(merged)
    } catch (e) {
      setDocError(e instanceof Error ? e.message : String(e))
    } finally {
      setAnalysing(false)
    }
  }

  async function seeContract() {
    const mid = await save()
    if (mid) router.push(`/dashboard/bien/${mid}/contrat`)
  }

  async function handlePropertySaved(p: Property) {
    setProperty(p)
    setPropertyId(p.id)
    const mid = mandateId || await save()
    if (mid) {
      await supabase.from('property_mandates').update({ property_id: p.id }).eq('id', mid)
      await supabase.from('property_documents').update({ property_id: p.id }).eq('mandate_id', mid)
    }
    setSavedAt(new Date())
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Chargement…</p></div>

  const report: MergeReport | null = d.lecture ? { filled: d.lecture.filled, conflicts: d.lecture.conflicts } : null
  const title = property?.title || ownersLabel(d) || d.imovel.morada || 'Nouveau bien'
  const TABS: [Tab, string][] = [
    ['documents', `📎 Documents${docs.length ? ` (${docs.length})` : ''}`],
    ['mandat', '📝 Mandat (CMI)'],
    ['annonce', property ? '🏡 Annonce' : '🏡 Annonce (à créer)'],
  ]

  return (
    <main className="min-h-screen bg-gray-50 pb-28">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 whitespace-nowrap">← Mes biens</Link>
          <h1 className="font-bold text-gray-900 truncate">{title}</h1>
        </div>
        <span className={`text-xs px-2 py-1 rounded-lg font-medium whitespace-nowrap ${CMI_STATUS[status].bg}`}>Mandat : {CMI_STATUS[status].label}</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 pt-6">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {TABS.map(([t, label]) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {tab === 'documents' && (
          <DocumentsPanel
            docs={docs} uploading={uploading} analysing={analysing} error={docError}
            report={report} alerts={d.lecture?.alertas || []}
            onFiles={uploadFiles} onDelete={deleteDoc} onOpen={openDoc} onAnalyse={analyse}
            onGoToMandate={() => setTab('mandat')} />
        )}
        {tab === 'mandat' && (
          <CmiForm d={d} up={up} type={type} setType={setType} status={status} setStatus={setStatus} />
        )}
        {tab === 'annonce' && userId && (
          <>
            {!property && <p className="text-xs text-gray-400 mb-3">Prix, lieu, surface et type sont repris du mandat. Complétez puis enregistrez pour publier le bien.</p>}
            <PropertyForm
              key={property?.id || 'new'}
              agentId={userId}
              property={property}
              prefill={prefillFromCmi(d)}
              onSaved={handlePropertySaved}
              onClose={() => setTab('mandat')}
              inline
            />
          </>
        )}
      </div>

      {tab !== 'annonce' && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
            {error && <p className="text-sm text-red-500 mr-auto">{error}</p>}
            {!error && savedAt && <p className="text-xs text-gray-400 mr-auto">Enregistré à {savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>}
            <button type="button" onClick={() => save()} disabled={saving}
              className="text-sm font-semibold px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={seeContract} disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              📄 Voir / imprimer le contrat
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
