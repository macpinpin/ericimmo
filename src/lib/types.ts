export type AgentPublic = {
  id: string
  name: string
  phone: string | null
  email: string
  contact_email: string | null
  whatsapp: string | null
}

export type Match = {
  id: string
  buyer_id: string
  property_id: string
  buyer_agent_id: string
  seller_agent_id: string
  score: number
  status: 'new' | 'seen' | 'dismissed'
  notified_at: string | null
  created_at: string
  buyer?: Buyer
  property?: Property
  buyer_agent?: AgentPublic
  seller_agent?: AgentPublic
}

export type Buyer = {
  id: string
  agent_id: string
  name: string
  first_name: string | null
  last_name: string | null
  company: string | null
  email: string | null
  phone: string | null
  nationality: string | null
  birthday: string | null
  source: string | null
  property_type: string | null
  budget_min: number | null
  budget_max: number | null
  bedrooms_min: number | null
  district: string | null
  concelho: string | null
  freguesia: string | null
  area_min: number | null
  area_max: number | null
  status: 'hot' | 'warm' | 'cold'
  notes: string | null
  first_contact: string | null
  last_contact: string | null
  contact_synced_at: string | null
  created_at: string
}

export type Agent = {
  id: string
  email: string
  contact_email: string | null
  name: string
  slug: string | null
  phone: string | null
  whatsapp: string | null
  photo_url: string | null
  network: string | null
  powered_by: string | null
  bio: string | null
  bio_translations: Record<string, string> | null
  created_at: string
}

export type Property = {
  id: string
  agent_id: string
  title: string
  description: string | null
  price: number
  type: 'villa' | 'apartment' | 'land' | 'commercial' | 'other'
  status: 'active' | 'sold' | 'draft'
  location: string
  district: string | null
  concelho: string | null
  freguesia: string | null
  area_bruta_privativa: number | null
  area_bruta_dependente: number | null
  area_utile: number | null
  plot: number | null
  bedrooms: number | null
  bathrooms: number | null
  images: string[]
  matterport_url: string | null
  video_url: string | null
  ref: string | null
  is_offmarket: boolean
  translations: {
    title?: Record<string, string>
    description?: Record<string, string>
  } | null
  matriz_artigo: string | null
  conservatoria_registo: string | null
  conservatoria_numero: string | null
  certificado_energetico_numero: string | null
  certificado_energetico_validade: string | null
  licenca_numero: string | null
  licenca_data: string | null
  ano_construcao: number | null
  created_at: string
}

export type PropertyOwnerKind = 'singular' | 'coletiva'

export type PropertyOwner = {
  kind: PropertyOwnerKind
  civility?: string
  first_name?: string
  last_name?: string
  birth_date?: string
  birth_place?: string
  country?: string
  nationality?: string
  address?: string
  postal_code?: string
  locality?: string
  phone?: string
  email?: string
  marital_status?: string
  marital_regime?: string
  ownership_nature?: string
  id_doc_type?: string
  id_doc_number?: string
  id_doc_expiry?: string
  nif?: string
  // Pessoa coletiva
  company_name?: string
  legal_nature?: string
  share_capital?: number
  registry_office?: string
  registered_office?: string
  rep_first_name?: string
  rep_last_name?: string
  rep_capacity?: string
  rep_id_doc_type?: string
  rep_id_doc_number?: string
  rep_nif?: string
}

export type PropertyMandate = {
  id: string
  property_id: string
  agent_id: string
  contract_type: 'exclusivo' | 'semi_exclusivo' | 'nao_exclusivo'
  business_type: 'compra' | 'trespasse' | 'arrendamento'
  owners: PropertyOwner[]
  price: number | null
  additional_service_fee: number | null
  liens_free: boolean
  liens_description: string | null
  commission_type: 'percentage' | 'fixed'
  commission_percentage: number | null
  commission_fixed_amount: number | null
  payment_full_at_deed: boolean
  payment_split_promissory_pct: number | null
  payment_split_deed_pct: number | null
  lister_name: string | null
  lister_id_doc: string | null
  lister_nif: string | null
  lister_phone: string | null
  lister_email: string | null
  competent_court: string | null
  special_conditions: string | null
  contract_duration_months: number
  status: 'draft' | 'signed' | 'terminated'
  signed_at: string | null
  created_at: string
}

export type Colleague = {
  id: string
  agent_id: string
  first_name: string
  last_name: string
  title: string | null
  agency: string | null
  phone: string | null
  email: string | null
  district: string | null
  concelho: string | null
  specialty: string | null
  property_id: string | null
  notes: string | null
  contact_synced_at: string | null
  created_at: string
}
