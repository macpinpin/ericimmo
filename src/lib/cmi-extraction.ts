// Lecture automatique des documents d'angariação : schéma de la réponse
// demandée à Claude, et fusion du résultat dans le formulaire du CMI.
// Partagé entre la route API (serveur) et la page du dossier (navigateur).

import { emptyOwner, type CmiData, type Owner, type Person } from './cmi'

export const DOC_TYPES = {
  a_classer: 'À classer',
  cartao_cidadao: 'Cartão de Cidadão',
  passaporte: 'Passaporte',
  bilhete_identidade: 'Bilhete de Identidade',
  cartao_contribuinte: 'Cartão de Contribuinte (NIF)',
  certidao_comercial: 'Certidão do Registo Comercial',
  caderneta_predial: 'Caderneta Predial',
  certidao_registo_predial: 'Certidão do Registo Predial',
  licenca_utilizacao: 'Licença de Utilização',
  ficha_tecnica: 'Ficha Técnica da Habitação',
  planta: 'Planta do Imóvel',
  certificado_energetico: 'Certificado Energético',
  procuracao: 'Procuração',
  contrato_arrendamento: 'Contrato de Arrendamento',
  outro: 'Autre document',
} as const

export type DocType = keyof typeof DOC_TYPES

/** Type de document → case de la liste « documents nécessaires » du CMI. */
export const DOC_TO_CHECKLIST: Partial<Record<DocType, string>> = {
  cartao_cidadao: 'identificacao',
  passaporte: 'identificacao',
  bilhete_identidade: 'identificacao',
  cartao_contribuinte: 'identificacao',
  certidao_comercial: 'coletiva',
  certidao_registo_predial: 'registoPredial',
  caderneta_predial: 'caderneta',
  licenca_utilizacao: 'licenca',
  ficha_tecnica: 'fichaTecnica',
  planta: 'planta',
  certificado_energetico: 'certificado',
  procuracao: 'procuracao',
}

// ── Résultat attendu de Claude ──────────────────────────────────────────
// Pas de valeurs nulles dans le schéma (les sorties structurées limitent le
// nombre d'unions de types) : une chaîne vide = information absente,
// fonte = 0 = source inconnue.

type Val = { valor: string; fonte: number }

type ExtractedPerson = {
  nome: string
  apelidos: string
  sexo: '' | 'M' | 'F'
  nascimento: string
  naturalidade: string
  pais: string
  nacionalidade: string
  morada: string
  codigoPostal: string
  localidade: string
  paisMorada: string
  docTipo: '' | 'cc' | 'passaporte' | 'bi'
  docNumero: string
  docValidade: string
  nif: string
  fontes: number[]
}

export type Extraction = {
  documentos: { indice: number; tipo: DocType; resumo: string }[]
  ownerKind: '' | 'singular' | 'coletiva'
  proprietarios: (ExtractedPerson & {
    estadoCivil: '' | 'solteiro' | 'casado' | 'uniao' | 'divorciado' | 'viuvo'
    regimeBens: string
    direito: '' | 'plena' | 'nua' | 'usufruto' | 'indiviso'
  })[]
  empresa: {
    firma: Val; naturezaJuridica: Val; capital: Val; conservatoria: Val; sede: Val; qualidade: Val
    representante: ExtractedPerson
  }
  imovel: {
    destino: Val; natureza: Val; divisoes: Val; area: Val; morada: Val; freguesia: Val; concelho: Val
    conservatoria: Val; registoNumero: Val; registoFreguesia: Val
    licencaNumero: Val; licencaCamara: Val; licencaData: Val
    matriz: Val; artigo: Val; matrizFreguesia: Val; matrizConcelho: Val
    certificadoNumero: Val; certificadoValidade: Val
  }
  onus: { situacao: '' | 'livre' | 'onerado'; tipo: '' | 'hipotecas' | 'penhoras' | 'ambas'; valor: string; fonte: number }
  alertas: string[]
}

// La réponse est demandée en JSON libre (un schéma strict de cette taille
// dépasse la limite des sorties structurées), puis normalisée ci-dessous.

const PERSON_KEYS = ['nome', 'apelidos', 'sexo', 'nascimento', 'naturalidade', 'pais', 'nacionalidade', 'morada',
  'codigoPostal', 'localidade', 'paisMorada', 'docTipo', 'docNumero', 'docValidade', 'nif'] as const
const IMOVEL_KEYS = ['destino', 'natureza', 'divisoes', 'area', 'morada', 'freguesia', 'concelho', 'conservatoria',
  'registoNumero', 'registoFreguesia', 'licencaNumero', 'licencaCamara', 'licencaData', 'matriz', 'artigo',
  'matrizFreguesia', 'matrizConcelho', 'certificadoNumero', 'certificadoValidade'] as const
const EMPRESA_KEYS = ['firma', 'naturezaJuridica', 'capital', 'conservatoria', 'sede', 'qualidade'] as const

const ENUMS: Record<string, readonly string[]> = {
  sexo: ['M', 'F'],
  docTipo: ['cc', 'passaporte', 'bi'],
  estadoCivil: ['solteiro', 'casado', 'uniao', 'divorciado', 'viuvo'],
  direito: ['plena', 'nua', 'usufruto', 'indiviso'],
  ownerKind: ['singular', 'coletiva'],
  situacao: ['livre', 'onerado'],
  tipo: ['hipotecas', 'penhoras', 'ambas'],
  destino: ['fracao', 'predio', 'comercial'],
  natureza: ['urbano', 'rustico', 'misto'],
  matriz: ['urbana', 'rustica'],
}

// Modèle de réponse montré à Claude
const personTemplate = Object.fromEntries([...PERSON_KEYS.map(k => [k, '']), ['fontes', [1]]])
const val = { valor: '', fonte: 0 }
const TEMPLATE = {
  documentos: [{ indice: 1, tipo: 'caderneta_predial', resumo: '' }],
  ownerKind: '',
  proprietarios: [{ ...personTemplate, estadoCivil: '', regimeBens: '', direito: '' }],
  empresa: { ...Object.fromEntries(EMPRESA_KEYS.map(k => [k, val])), representante: personTemplate },
  imovel: Object.fromEntries(IMOVEL_KEYS.map(k => [k, val])),
  onus: { situacao: '', tipo: '', valor: '', fonte: 0 },
  alertas: [''],
}

const str = (v: unknown) => (v == null ? '' : typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '')
const int = (v: unknown) => { const n = Number(v); return Number.isFinite(n) ? Math.trunc(n) : 0 }
const en = <T extends string>(key: string, v: unknown) => { const x = str(v); return (ENUMS[key].includes(x) ? x : '') as T | '' }
const asObj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {})
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : [])

function person(v: unknown): ExtractedPerson {
  const o = asObj(v)
  const out: Record<string, unknown> = {}
  for (const k of PERSON_KEYS) out[k] = k === 'sexo' || k === 'docTipo' ? en(k, o[k]) : str(o[k])
  out.fontes = asArr(o.fontes).map(int).filter(n => n > 0)
  return out as ExtractedPerson
}
const valOf = (v: unknown): Val => { const o = asObj(v); return { valor: str(o.valor), fonte: int(o.fonte) } }

/** Transforme la réponse JSON de Claude en Extraction complète et typée. */
export function normalizeExtraction(raw: unknown): Extraction {
  const r = asObj(raw)
  const emp = asObj(r.empresa)
  const im = asObj(r.imovel)
  const on = asObj(r.onus)
  return {
    documentos: asArr(r.documentos).map(x => {
      const o = asObj(x)
      const tipo = str(o.tipo)
      return { indice: int(o.indice), tipo: (tipo in DOC_TYPES ? tipo : 'outro') as DocType, resumo: str(o.resumo) }
    }).filter(x => x.indice > 0),
    ownerKind: en('ownerKind', r.ownerKind),
    proprietarios: asArr(r.proprietarios).map(x => {
      const o = asObj(x)
      return { ...person(o), estadoCivil: en('estadoCivil', o.estadoCivil), regimeBens: str(o.regimeBens), direito: en('direito', o.direito) }
    }),
    empresa: {
      ...(Object.fromEntries(EMPRESA_KEYS.map(k => [k, valOf(emp[k])])) as Record<typeof EMPRESA_KEYS[number], Val>),
      representante: person(emp.representante),
    },
    imovel: Object.fromEntries(IMOVEL_KEYS.map(k => {
      const v = valOf(im[k])
      if (k in ENUMS) v.valor = en(k, v.valor)
      return [k, v]
    })) as Extraction['imovel'],
    onus: { situacao: en('situacao', on.situacao), tipo: en('tipo', on.tipo), valor: str(on.valor), fonte: int(on.fonte) },
    alertas: asArr(r.alertas).map(str).filter(Boolean),
  }
}

/** Récupère l'objet JSON d'une réponse texte (éventuellement entourée de ```json). */
export function parseJsonReply(text: string): unknown {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(text)
  const body = fenced ? fenced[1] : text
  const start = body.indexOf('{'), end = body.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('Réponse illisible')
  return JSON.parse(body.slice(start, end + 1))
}

export const EXTRACTION_PROMPT = `Tu es l'assistant d'un agent immobilier au Portugal. Il prépare un Contrato de Mediação Imobiliária (CMI) et t'a transmis les documents du dossier, numérotés (Documento 1, 2, …).

Pour chaque document, indique son type et un résumé d'une ligne en français.

Extrais ensuite les informations utiles au contrat :
- proprietarios : chaque propriétaire personne physique identifié (Cartão de Cidadão, passaporte, BI, carte NIF ; les titulaires inscrits sur la caderneta ou la certidão permanente comptent aussi). Fusionne les informations d'une même personne venant de plusieurs documents. « nome » = prénom(s), « apelidos » = nom(s) de famille. Ne renseigne l'état civil, le régime matrimonial ou la nature du droit que si un document l'indique (la certidão do registo predial mentionne souvent « casado com … no regime de … »).
- empresa : si le propriétaire est une société (certidão comercial, NIPC sur la caderneta…), sa firme, sa forme juridique, son capital, la conservatória, le siège, et le gérant ou représentant qui l'engage (avec sa qualité, ex. « Gerente »). Sinon laisse tous ses champs vides.
- imovel : destino = "fracao" (fração autónoma), "predio" (prédio de habitação) ou "comercial" ; natureza = "urbano", "rustico" ou "misto" ; matriz = "urbana" ou "rustica" ; divisoes = nombre de divisões assoalhadas (le chiffre de la typologie T3 → 3, si connu) ; area = surface totale en m² (área bruta privativa pour une fração, sinon área total) ; conservatoria = ville de la Conservatória do Registo Predial ; registoNumero = numéro de description (descrição) ; licença de utilização : numéro, câmara municipal, date ; certificat énergétique : numéro et date de validité.
- onus : charges inscrites sur la certidão do registo predial (hipotecas, penhoras) ; situacao = "livre" seulement si la certidão est fournie et ne montre aucune charge en vigueur, "onerado" s'il y en a, "" si la certidão n'est pas fournie.
- alertas : en français, courtes, tout ce que l'agent doit vérifier : informations contradictoires entre documents (surface, article, titulaires…), documents expirés ou expirant bientôt (pièce d'identité, certificat énergétique), documents obligatoires manquants, document illisible, propriétaire présent sur la caderneta mais sans pièce d'identité, etc.

Règles :
- Recopie les valeurs exactement comme dans les documents (accents, majuscules des noms propres en casse normale, ex. « Maria José » et non « MARIA JOSÉ »).
- Dates au format AAAA-MM-JJ.
- Montants et surfaces en chiffres, sans unité (ex. « 125.5 »).
- « fonte » / « fontes » = numéro(s) du ou des documents d'où vient l'information (0 si aucune).
- N'invente rien : si une information n'apparaît pas clairement, laisse une chaîne vide "".

Valeurs autorisées : documentos[].tipo ∈ ${Object.keys(DOC_TYPES).filter(k => k !== 'a_classer').join(', ')} ; ownerKind ∈ singular, coletiva ; sexo ∈ M, F ; docTipo ∈ cc, passaporte, bi ; estadoCivil ∈ solteiro, casado, uniao, divorciado, viuvo ; direito ∈ plena, nua, usufruto, indiviso ; onus.situacao ∈ livre, onerado ; onus.tipo ∈ hipotecas, penhoras, ambas ; ou "" si inconnu.

Réponds uniquement avec un objet JSON (sans texte autour) qui suit exactement cette structure :
${JSON.stringify(TEMPLATE)}`

// ── Fusion dans le formulaire ───────────────────────────────────────────

export type MergeReport = {
  /** Champs remplis automatiquement : libellé → document source. */
  filled: { field: string; source: string }[]
  /** Champs déjà remplis à la main avec une valeur différente. */
  conflicts: { field: string; current: string; found: string; source: string }[]
}

type DocName = (index: number | null | undefined) => string

const IMOVEL_LABELS: Record<string, string> = {
  destino: 'Destination', natureza: 'Nature', divisoes: 'Divisões', area: 'Surface', morada: 'Adresse du bien',
  freguesia: 'Freguesia', concelho: 'Concelho', conservatoria: 'Conservatória', registoNumero: 'N.º de registo predial',
  registoFreguesia: 'Freguesia (registo)', licencaNumero: 'N.º de licence', licencaCamara: 'Câmara (licence)',
  licencaData: 'Date de licence', matriz: 'Matriz', artigo: 'Artigo matricial', matrizFreguesia: 'Freguesia (matriz)',
  matrizConcelho: 'Concelho (matriz)', certificadoNumero: 'N.º certificat énergétique', certificadoValidade: 'Validité certificat',
}

const PERSON_LABELS: Record<string, string> = {
  nome: 'prénom', apelidos: 'nom', nascimento: 'date de naissance', naturalidade: 'naturalidade', pais: 'pays de naissance',
  nacionalidade: 'nationalité', morada: 'adresse', codigoPostal: 'code postal', localidade: 'localité', paisMorada: 'pays',
  docTipo: 'type de pièce', docNumero: 'n.º de pièce', docValidade: 'validité de la pièce', nif: 'NIF',
}

const EMPRESA_LABELS: Record<string, string> = {
  firma: 'Société – firma', naturezaJuridica: 'Société – forme juridique', capital: 'Société – capital',
  conservatoria: 'Société – conservatória', sede: 'Société – siège', qualidade: 'Représentant – qualité',
}

const PERSON_FIELDS = ['nome', 'apelidos', 'nascimento', 'naturalidade', 'pais', 'nacionalidade', 'morada', 'codigoPostal',
  'localidade', 'paisMorada', 'docTipo', 'docNumero', 'docValidade', 'nif'] as const

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

/**
 * Fusionne l'extraction dans les données du CMI : remplit les champs vides,
 * signale les champs déjà remplis avec une autre valeur (sans les écraser).
 */
export function mergeExtraction(
  current: CmiData, ex: Extraction, docName: DocName,
): { data: CmiData; report: MergeReport } {
  const d: CmiData = structuredClone(current)
  const report: MergeReport = { filled: [], conflicts: [] }

  function put(label: string, cur: string, found: string | null | undefined, source: string, apply: (v: string) => void) {
    if (found == null || String(found).trim() === '') return
    const v = String(found).trim()
    if (!cur || !cur.trim()) { apply(v); report.filled.push({ field: label, source }) }
    else if (norm(cur) !== norm(v)) report.conflicts.push({ field: label, current: cur, found: v, source })
  }

  function mergePerson(target: Person, p: ExtractedPerson, prefix: string) {
    const src = p.fontes.map(i => docName(i)).filter(Boolean).join(', ')
    if (!target.civ && p.sexo) target.civ = p.sexo === 'M' ? 'Sr.' : 'Sra.'
    for (const k of PERSON_FIELDS) {
      put(`${prefix} – ${PERSON_LABELS[k]}`, target[k] as string, p[k], src, v => { (target as Record<string, string>)[k] = v })
    }
  }

  // Vendeurs
  if (ex.ownerKind === 'coletiva') {
    d.ownerKind = 'coletiva'
    for (const k of EMPRESA_KEYS) {
      const val = ex.empresa[k]
      put(EMPRESA_LABELS[k], d.empresa[k], val.valor, docName(val.fonte), v => { d.empresa[k] = v })
    }
    mergePerson(d.empresa.representante, ex.empresa.representante, 'Représentant')
  } else if (ex.proprietarios.length) {
    if (ex.ownerKind === 'singular') d.ownerKind = 'singular'
    for (const p of ex.proprietarios) {
      // Retrouve le propriétaire par NIF, n.º de document ou nom ; sinon prend une fiche vide ou en ajoute une.
      const key = (o: Owner | typeof p) => [o.nif, o.docNumero].filter(Boolean).map(x => norm(String(x)))
      const fullName = (o: { nome: string | null; apelidos: string | null }) => norm(`${o.nome || ''} ${o.apelidos || ''}`)
      let target = d.owners.find(o => key(o).some(k => key(p).includes(k)))
        || d.owners.find(o => fullName(o) && fullName(o) === fullName(p))
        || d.owners.find(o => !o.nome && !o.apelidos && !o.nif)
      if (!target) { target = emptyOwner(); d.owners.push(target) }
      const label = `Propriétaire ${d.owners.indexOf(target) + 1}`
      mergePerson(target, p, label)
      const src = p.fontes.map(i => docName(i)).join(', ')
      if (p.estadoCivil) put(`${label} – état civil`, target.estadoCivil, p.estadoCivil, src, v => { target.estadoCivil = v as Owner['estadoCivil'] })
      put(`${label} – régime`, target.regimeBens, p.regimeBens, src, v => { target.regimeBens = v })
      if (p.direito) put(`${label} – droit`, target.direito, p.direito, src, v => { target.direito = v as Owner['direito'] })
    }
  }

  // Bien
  for (const k of IMOVEL_KEYS) {
    const val = ex.imovel[k]
    put(IMOVEL_LABELS[k], d.imovel[k], val.valor, docName(val.fonte), v => { (d.imovel as Record<string, string>)[k] = v })
  }

  // Charges : n'écrase pas un choix fait à la main (« libre » est la valeur par défaut)
  if (ex.onus.situacao === 'onerado') {
    d.onusLivre = false
    put('Charges – type', d.onusTipo, ex.onus.tipo, docName(ex.onus.fonte), v => { d.onusTipo = v as CmiData['onusTipo'] })
    put('Charges – montant', d.onusValor, ex.onus.valor, docName(ex.onus.fonte), v => { d.onusValor = v })
  }

  // Liste des documents : coche « présenté » et « reçu »
  for (const doc of ex.documentos) {
    const key = DOC_TO_CHECKLIST[doc.tipo]
    if (key) d.docs[key] = { apresentado: true, recebido: true }
  }

  return { data: d, report }
}

