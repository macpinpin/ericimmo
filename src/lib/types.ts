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
  created_at: string
}
