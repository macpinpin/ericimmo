// Module d'angariação : Contrat de Médiation Immobilière (CMI).
// Un seul modèle, trois variantes (exclusif, semi-exclusif, non exclusif) :
// seuls le titre, la clause 1 et la clause 8 changent.

// Valeurs alignées sur les contraintes de la table property_mandates.
export type CmiType = 'exclusivo' | 'semi_exclusivo' | 'nao_exclusivo'
export type CmiStatus = 'draft' | 'signed' | 'terminated'

export const CMI_TYPES: Record<CmiType, { fr: string; pt: string; regime: string; regimeLower: string }> = {
  exclusivo: { fr: 'Exclusif', pt: 'Exclusivo', regime: 'EXCLUSIVIDADE', regimeLower: 'exclusividade' },
  semi_exclusivo: { fr: 'Semi-exclusif', pt: 'Semi-Exclusivo', regime: 'SEMI-EXCLUSIVIDADE', regimeLower: 'semi-exclusividade' },
  nao_exclusivo: { fr: 'Non exclusif', pt: 'Não Exclusivo', regime: 'NÃO EXCLUSIVIDADE', regimeLower: 'não exclusividade' },
}

export const CMI_STATUS: Record<CmiStatus, { label: string; bg: string }> = {
  draft: { label: 'Brouillon', bg: 'bg-yellow-50 text-yellow-600' },
  signed: { label: 'Signé', bg: 'bg-green-50 text-green-600' },
  terminated: { label: 'Résilié', bg: 'bg-gray-100 text-gray-500' },
}

export const CMI_VERSION = 'V11 – 25/11/2026'

// Informations de l'agence (« Mediadora »). Pour l'instant SAFTI ;
// deviendra configurable par agence (étape 3).
export const MEDIADORA = {
  brand: 'SAFTI',
  name: 'SAFTI Portugal, Unipessoal Lda.',
  address: 'Rua Rodrigo da Fonseca, 82, 2.º Esq., 1250-193 Lisboa',
  capital: '50.000 € (cinquenta mil euros)',
  conservatoria: 'Braga',
  nipc: '515581712',
  ami: '17184',
  insurer: 'Ocidental',
  policy: 'RC78589672',
  insuredCapital: '150.000 €',
  email: 'contacto@safti.pt',
  color: '#e30613',
}

export type Person = {
  civ: '' | 'Sr.' | 'Sra.'
  nome: string
  apelidos: string
  nascimento: string
  naturalidade: string
  pais: string
  nacionalidade: string
  morada: string
  codigoPostal: string
  localidade: string
  paisMorada: string
  telefone: string
  email: string
  docTipo: '' | 'cc' | 'passaporte' | 'bi'
  docNumero: string
  docValidade: string
  nif: string
}

export type Owner = Person & {
  estadoCivil: '' | 'solteiro' | 'casado' | 'uniao' | 'divorciado' | 'viuvo'
  regimeBens: string
  direito: '' | 'plena' | 'nua' | 'usufruto' | 'indiviso'
}

export const DOC_CHECKLIST = [
  { key: 'identificacao', label: 'Bilhete de Identidade e Cartão de Contribuinte ou Cartão de Cidadão' },
  { key: 'coletiva', label: 'Em caso de Pessoa Coletiva, Certidão do Registo Comercial, Bilhete de Identidade e Cartão de Contribuinte ou Cartão de Cidadão da(s) pessoa(s) que obriga(m) a sociedade' },
  { key: 'registoPredial', label: 'Certidão de Teor ou Certidão do Registo Predial' },
  { key: 'caderneta', label: 'Caderneta Predial' },
  { key: 'licenca', label: 'Licença de Habitabilidade/Utilização (para imóveis de construção posterior a 1951)' },
  { key: 'fichaTecnica', label: 'Ficha Técnica do Imóvel (para licenças posteriores a março de 2004)' },
  { key: 'planta', label: 'Planta do Imóvel' },
  { key: 'certificado', label: 'Certificado Energético' },
  { key: 'procuracao', label: 'Procuração (se necessário)' },
] as const

export type DocKey = typeof DOC_CHECKLIST[number]['key']

export type CmiData = {
  registo: string
  consultor: string
  docs: Record<string, { apresentado: boolean; recebido: boolean }>
  outrosDocs: string

  ownerKind: 'singular' | 'coletiva'
  owners: Owner[]
  empresa: {
    firma: string
    naturezaJuridica: string
    capital: string
    conservatoria: string
    sede: string
    qualidade: string
    representante: Person
  }

  imovel: {
    destino: '' | 'fracao' | 'predio' | 'comercial'
    natureza: '' | 'rustico' | 'urbano' | 'misto'
    divisoes: string
    area: string
    morada: string
    freguesia: string
    concelho: string
    conservatoria: string
    registoNumero: string
    registoFreguesia: string
    licencaNumero: string
    licencaCamara: string
    licencaData: string
    matriz: '' | 'urbana' | 'rustica'
    artigo: string
    matrizFreguesia: string
    matrizConcelho: string
    certificadoNumero: string
    certificadoValidade: string
  }

  negocio: { compra: boolean; trespasse: boolean; arrendamento: boolean }
  preco: string
  servicoDocs: boolean
  servicoDocsValor: string

  onusLivre: boolean
  onusTipo: '' | 'hipotecas' | 'penhoras' | 'ambas'
  onusValor: string

  remuneracaoModo: 'percent' | 'fixo'
  remuneracaoPct: string
  remuneracaoValor: string
  pagamento: 'escritura' | 'faseado'
  pagamentoPctCpcv: string
  pagamentoPctEscritura: string

  angariador: { nome: string; documento: string; nif: string; telefone: string; email: string }
  foro: string
  condicoes: string
  /** Durée du contrat en mois (clause 9), 6 par défaut. */
  duracaoMeses: string
  /** Clauses facultatives explicitement « sans objet » (imprimées « — »). */
  foroNA: boolean
  angariadorNA: boolean
  /** Bien inscrit avant 1951 : dispensé de licença de utilização. */
  licencaIsenta: boolean
  /** Version du contrat corrigée à la main sur la page d'impression. */
  contratEditado?: { html: string; at: string }
  local: string
  data: string
  /** Dernière lecture automatique des documents (compte rendu affiché dans le dossier). */
  lecture?: {
    at: string
    filled: { field: string; source: string }[]
    conflicts: { field: string; current: string; found: string; source: string }[]
    alertas: string[]
  }
}

export const emptyPerson = (): Person => ({
  civ: '', nome: '', apelidos: '', nascimento: '', naturalidade: '', pais: '', nacionalidade: '',
  morada: '', codigoPostal: '', localidade: '', paisMorada: '', telefone: '', email: '',
  docTipo: '', docNumero: '', docValidade: '', nif: '',
})

export const emptyOwner = (): Owner => ({ ...emptyPerson(), estadoCivil: '', regimeBens: '', direito: '' })

export function emptyCmiData(consultor = ''): CmiData {
  return {
    registo: '',
    consultor,
    docs: Object.fromEntries(DOC_CHECKLIST.map(d => [d.key, { apresentado: false, recebido: false }])),
    outrosDocs: '',
    ownerKind: 'singular',
    owners: [emptyOwner()],
    empresa: { firma: '', naturezaJuridica: '', capital: '', conservatoria: '', sede: '', qualidade: '', representante: emptyPerson() },
    imovel: {
      destino: '', natureza: '', divisoes: '', area: '', morada: '', freguesia: '', concelho: '',
      conservatoria: '', registoNumero: '', registoFreguesia: '', licencaNumero: '', licencaCamara: '', licencaData: '',
      matriz: '', artigo: '', matrizFreguesia: '', matrizConcelho: '', certificadoNumero: '', certificadoValidade: '',
    },
    negocio: { compra: true, trespasse: false, arrendamento: false },
    preco: '',
    servicoDocs: false,
    servicoDocsValor: '',
    onusLivre: true,
    onusTipo: '',
    onusValor: '',
    remuneracaoModo: 'percent',
    remuneracaoPct: '',
    remuneracaoValor: '',
    pagamento: 'escritura',
    pagamentoPctCpcv: '',
    pagamentoPctEscritura: '',
    angariador: { nome: '', documento: '', nif: '', telefone: '', email: '' },
    foro: '',
    condicoes: '',
    duracaoMeses: '6',
    foroNA: false,
    angariadorNA: false,
    licencaIsenta: false,
    local: '',
    data: '',
  }
}

/** Fusionne des données enregistrées avec les valeurs par défaut (champs ajoutés plus tard). */
export function withDefaults(saved: Partial<CmiData> | null | undefined, consultor = ''): CmiData {
  const base = emptyCmiData(consultor)
  if (!saved) return base
  return {
    ...base,
    ...saved,
    docs: { ...base.docs, ...(saved.docs || {}) },
    owners: (saved.owners?.length ? saved.owners : base.owners).map(o => ({ ...emptyOwner(), ...o })),
    empresa: { ...base.empresa, ...(saved.empresa || {}), representante: { ...emptyPerson(), ...(saved.empresa?.representante || {}) } },
    imovel: { ...base.imovel, ...(saved.imovel || {}) },
    negocio: { ...base.negocio, ...(saved.negocio || {}) },
    angariador: { ...base.angariador, ...(saved.angariador || {}) },
  }
}

/** Valeurs mémorisées par l'agent pour ses prochains contrats (agents.cmi_defaults). */
export type CmiDefaults = { angariador?: CmiData['angariador']; angariadorNA?: boolean }

/** Applique les valeurs mémorisées aux champs encore vides. */
export function applyDefaults(d: CmiData, defaults: CmiDefaults | null | undefined): CmiData {
  if (!defaults) return d
  const empty = !d.angariadorNA && !Object.values(d.angariador).some(v => v && v.trim())
  if (!empty) return d
  if (defaults.angariadorNA) return { ...d, angariadorNA: true }
  if (defaults.angariador) return { ...d, angariador: { ...d.angariador, ...defaults.angariador } }
  return d
}

/** Nom affiché du ou des vendeurs. */
export function ownersLabel(d: CmiData): string {
  if (d.ownerKind === 'coletiva') return d.empresa.firma
  return d.owners.map(o => [o.nome, o.apelidos].filter(Boolean).join(' ')).filter(Boolean).join(', ')
}

// ── Nombres en toutes lettres (portugais européen) ──────────────────────

const UNITS = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
  'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezasseis', 'dezassete', 'dezoito', 'dezanove']
const TENS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const HUNDREDS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

function below1000(n: number): string {
  if (n === 100) return 'cem'
  const parts: string[] = []
  const h = Math.floor(n / 100), rest = n % 100
  if (h) parts.push(HUNDREDS[h])
  if (rest) {
    if (rest < 20) parts.push(UNITS[rest])
    else {
      const t = Math.floor(rest / 10), u = rest % 10
      parts.push(u ? `${TENS[t]} e ${UNITS[u]}` : TENS[t])
    }
  }
  return parts.join(' e ')
}

/** Entier positif en toutes lettres : 350000 → « trezentos e cinquenta mil ». */
export function integerToWords(n: number): string {
  n = Math.floor(Math.abs(n))
  if (n === 0) return 'zero'
  const scales: [number, string, string][] = [
    [1e9, 'mil milhões', 'mil milhões'],
    [1e6, 'um milhão', 'milhões'],
    [1e3, 'mil', 'mil'],
  ]
  const groups: { value: number; text: string }[] = []
  let rest = n
  for (const [size, singular, plural] of scales) {
    const q = Math.floor(rest / size)
    if (q) {
      if (size === 1e9) groups.push({ value: q, text: q === 1 ? singular : `${below1000(q)} ${plural}` })
      else if (size === 1e6) groups.push({ value: q, text: q === 1 ? singular : `${below1000(q)} ${plural}` })
      else groups.push({ value: q, text: q === 1 ? 'mil' : `${below1000(q)} mil` })
    }
    rest %= size
  }
  if (rest) groups.push({ value: rest, text: below1000(rest) })
  // Règle du « e » : avant le dernier groupe s'il est < 100 ou un multiple de 100.
  return groups.map((g, i) => {
    if (i === 0) return g.text
    const last = i === groups.length - 1
    return (last && (g.value < 100 || g.value % 100 === 0) ? ' e ' : ' ') + g.text
  }).join('')
}

export function parseAmount(s: string): number | null {
  if (!s) return null
  const clean = s.replace(/\s|€/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  const n = Number(clean)
  return Number.isFinite(n) ? n : null
}

/** Montant en euros en toutes lettres (sans le mot « euros », imprimé à côté). */
export function amountToWords(s: string): string {
  const n = parseAmount(s)
  if (n === null) return ''
  const euros = Math.floor(n)
  const cents = Math.round((n - euros) * 100)
  let out = integerToWords(euros)
  if (euros >= 1e6 && euros % 1e6 === 0) out += ' de'
  if (cents) out += ` e ${integerToWords(cents)} ${cents === 1 ? 'cêntimo' : 'cêntimos'}`
  return out
}

/** Pourcentage en toutes lettres : « 4,5 » → « quatro vírgula cinco ». */
export function percentToWords(s: string): string {
  if (!s) return ''
  const [int, dec] = s.replace('%', '').trim().replace('.', ',').split(',')
  const i = Number(int)
  if (!Number.isFinite(i)) return ''
  let out = integerToWords(i)
  if (dec && /^\d+$/.test(dec) && Number(dec) > 0) {
    out += ' vírgula ' + (dec.startsWith('0') ? dec.split('').map(c => UNITS[Number(c)]).join(' ') : integerToWords(Number(dec)))
  }
  return out
}

export function formatAmount(s: string): string {
  const n = parseAmount(s)
  if (n === null) return s
  return new Intl.NumberFormat('pt-PT', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n)
}

/** Date ISO (aaaa-mm-jj) → jj/mm/aaaa. */
export function fmtDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '')
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s
}

/** Ligne de la table property_mandates. Le détail du formulaire est dans `data`. */
export type Mandate = {
  id: string
  agent_id: string
  property_id: string | null
  contract_type: CmiType
  status: CmiStatus
  price: number | null
  signed_at: string | null
  data: Partial<CmiData> | null
  created_at: string
  updated_at: string | null
}

/** Colonnes de synthèse recopiées depuis `data` à chaque enregistrement. */
export function summaryColumns(d: CmiData) {
  const pct = parseAmount(d.remuneracaoPct)
  const fixed = parseAmount(d.remuneracaoValor)
  return {
    business_type: d.negocio.compra ? 'compra' : d.negocio.trespasse ? 'trespasse' : d.negocio.arrendamento ? 'arrendamento' : 'compra',
    owners: d.ownerKind === 'coletiva'
      ? [{ name: d.empresa.firma, kind: 'coletiva' }]
      : d.owners.map(o => ({ name: [o.nome, o.apelidos].filter(Boolean).join(' '), kind: 'singular' })),
    price: parseAmount(d.preco),
    additional_service_fee: d.servicoDocs ? parseAmount(d.servicoDocsValor) : null,
    liens_free: d.onusLivre,
    liens_description: d.onusLivre ? null : [d.onusTipo, d.onusValor && `${d.onusValor} €`].filter(Boolean).join(' – ') || null,
    commission_type: d.remuneracaoModo === 'percent' ? 'percentage' : 'fixed',
    commission_percentage: d.remuneracaoModo === 'percent' ? pct : null,
    commission_fixed_amount: d.remuneracaoModo === 'fixo' ? fixed : null,
    payment_full_at_deed: d.pagamento === 'escritura',
    payment_split_promissory_pct: d.pagamento === 'faseado' ? parseAmount(d.pagamentoPctCpcv) : null,
    payment_split_deed_pct: d.pagamento === 'faseado' ? parseAmount(d.pagamentoPctEscritura) : null,
    lister_name: d.angariador.nome || null,
    lister_id_doc: d.angariador.documento || null,
    lister_nif: d.angariador.nif || null,
    lister_phone: d.angariador.telefone || null,
    lister_email: d.angariador.email || null,
    competent_court: d.foro || null,
    contract_duration_months: Math.max(1, Math.round(parseAmount(d.duracaoMeses) || 6)),
    special_conditions: d.condicoes || null,
  }
}

/**
 * Champs importants encore vides, avec la section du formulaire où les remplir.
 * Affichés en haut du mandat et sur la page du contrat avant impression.
 */
export function missingFields(d: CmiData): { label: string; section: number }[] {
  const out: { label: string; section: number }[] = []
  const need = (ok: unknown, label: string, section: number) => { if (!ok || (typeof ok === 'string' && !ok.trim())) out.push({ label, section }) }
  const person = (p: Person, who: string) => {
    need(p.nome && p.apelidos, `Nom et prénom du ${who}`, 2)
    need(p.civ, `Sr. / Sra. du ${who}`, 2)
    need(p.nascimento, `Date de naissance du ${who}`, 2)
    need(p.naturalidade, `Naturalidade du ${who}`, 2)
    need(p.pais, `Pays de naissance du ${who}`, 2)
    need(p.nacionalidade, `Nationalité du ${who}`, 2)
    need(p.morada, `Adresse du ${who}`, 2)
    need(p.codigoPostal, `Code postal du ${who}`, 2)
    need(p.localidade, `Localité du ${who}`, 2)
    need(p.paisMorada, `Pays de résidence du ${who}`, 2)
    need(p.telefone, `Téléphone du ${who}`, 2)
    need(p.email, `E-mail du ${who}`, 2)
    need(p.docTipo && p.docNumero, `Pièce d'identité du ${who}`, 2)
    need(p.docValidade, `Validité de la pièce du ${who}`, 2)
    need(p.nif, `NIF du ${who}`, 2)
  }

  need(d.registo, 'N.º de registo', 1)
  need(d.consultor, 'Nom du consultor', 1)
  need(d.negocio.compra || d.negocio.trespasse || d.negocio.arrendamento, 'Objet (vente, trespasse, location)', 1)

  if (d.ownerKind === 'singular') {
    d.owners.forEach((o, i) => {
      const who = d.owners.length > 1 ? `propriétaire ${i + 1}` : 'propriétaire'
      person(o, who)
      need(o.estadoCivil, `État civil du ${who}`, 2)
      if (o.estadoCivil === 'casado') need(o.regimeBens, `Régime matrimonial du ${who}`, 2)
      need(o.direito, `Nature du droit du ${who}`, 2)
    })
  } else {
    need(d.empresa.firma, 'Firma de la société', 2)
    need(d.empresa.naturezaJuridica, 'Forme juridique de la société', 2)
    need(d.empresa.capital, 'Capital social', 2)
    need(d.empresa.conservatoria, 'Conservatória du registo comercial', 2)
    need(d.empresa.sede, 'Siège de la société', 2)
    need(d.empresa.qualidade, 'Qualité du représentant', 2)
    person(d.empresa.representante, 'représentant')
  }

  const im = d.imovel
  need(im.destino, 'Destination du bien', 3)
  need(im.natureza, 'Nature (urbano / rústico / misto)', 3)
  need(im.divisoes, 'Divisões assoalhadas', 3)
  need(im.area, 'Surface totale', 3)
  need(im.morada, 'Adresse du bien', 3)
  need(im.freguesia, 'Freguesia du bien', 3)
  need(im.concelho, 'Concelho du bien', 3)
  need(im.conservatoria, 'Conservatória do registo predial', 3)
  need(im.registoNumero, 'N.º de registo predial', 3)
  need(im.registoFreguesia, 'Freguesia du registo predial', 3)
  if (!d.licencaIsenta) {
    need(im.licencaNumero, 'N.º de licença de utilização (ou « isento »)', 3)
    need(im.licencaCamara, 'Câmara de la licença', 3)
    need(im.licencaData, 'Date de la licença', 3)
  }
  need(im.matriz, 'Matriz (urbana / rústica)', 3)
  need(im.artigo, 'Artigo matricial', 3)
  need(im.matrizFreguesia, 'Freguesia de la matriz', 3)
  need(im.matrizConcelho, 'Concelho de la matriz', 3)
  need(im.certificadoNumero, 'N.º du certificat énergétique', 3)
  need(im.certificadoValidade, 'Validité du certificat énergétique', 3)

  need(parseAmount(d.preco), 'Prix', 4)
  if (d.servicoDocs) need(parseAmount(d.servicoDocsValor), 'Montant du service de documents', 4)
  if (!d.onusLivre) {
    need(d.onusTipo, 'Type de charges (hipotecas / penhoras)', 4)
    need(parseAmount(d.onusValor), 'Montant des charges', 4)
  }
  need(d.remuneracaoModo === 'percent' ? parseAmount(d.remuneracaoPct) : parseAmount(d.remuneracaoValor), 'Commission', 4)
  if (d.pagamento === 'faseado') need(d.pagamentoPctCpcv && d.pagamentoPctEscritura, 'Répartition du paiement (CPCV / escritura)', 4)

  if (!d.angariadorNA) need(d.angariador.nome && d.angariador.documento && d.angariador.nif, 'Angariador (ou « sans angariador »)', 5)
  if (!d.foroNA) need(d.foro, 'Foro competente (ou « sans foro »)', 5)
  need(parseAmount(d.duracaoMeses), 'Durée du contrat', 5)

  need(d.local, 'Lieu de signature', 7)
  need(d.data, 'Date de signature', 7)
  return out
}
