export type Agent = {
  id: string
  email: string
  name: string
  phone: string | null
  photo_url: string | null
  network: string | null
  bio: string | null
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
  area: number | null
  plot: number | null
  bedrooms: number | null
  bathrooms: number | null
  images: string[]
  matterport_url: string | null
  video_url: string | null
  ref: string | null
  translations: {
    title?: Record<string, string>
    description?: Record<string, string>
  } | null
  created_at: string
}
