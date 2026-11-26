'use client'

// Barre de tri / filtres commune aux listes du tableau de bord
// (biens, acheteurs, collègues). Le tri et le filtrage se font côté
// navigateur sur les données déjà chargées.

export type SortKey = 'recent' | 'oldest' | 'az' | 'za'
export type PeriodKey = 'all' | '7' | '30' | '90' | '365'

export type ListFilters = {
  search: string
  place: string
  sort: SortKey
  period: PeriodKey
}

export const DEFAULT_FILTERS: ListFilters = { search: '', place: '', sort: 'recent', period: 'all' }

// Minuscules + suppression des accents : « Lagôa » est trouvé avec « lagoa ».
export function normalize(s: string | null | undefined): string {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function matchesAll(haystack: (string | null | undefined)[], query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const text = haystack.map(normalize).join(' ')
  return words.every(w => text.includes(w))
}

/**
 * Applique recherche, lieu, période et tri à une liste.
 * - nameFields : champs fouillés par la recherche « nom »
 * - placeFields : champs fouillés par la recherche « lieu »
 * - sortLabel : texte utilisé pour l'ordre alphabétique
 */
export function applyListFilters<T extends { created_at: string }>(
  items: T[],
  filters: ListFilters,
  opts: {
    nameFields: (item: T) => (string | null | undefined)[]
    placeFields: (item: T) => (string | null | undefined)[]
    sortLabel: (item: T) => string
  },
): T[] {
  const minDate = filters.period === 'all' ? null : Date.now() - Number(filters.period) * 24 * 3600 * 1000
  const result = items.filter(item =>
    matchesAll(opts.nameFields(item), filters.search) &&
    matchesAll(opts.placeFields(item), filters.place) &&
    (minDate === null || new Date(item.created_at).getTime() >= minDate),
  )
  const collator = new Intl.Collator('fr', { sensitivity: 'base' })
  result.sort((a, b) => {
    switch (filters.sort) {
      case 'recent': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      case 'az': return collator.compare(opts.sortLabel(a), opts.sortLabel(b))
      case 'za': return collator.compare(opts.sortLabel(b), opts.sortLabel(a))
    }
  })
  return result
}

/** Liste des lieux distincts présents dans les données, pour les suggestions. */
export function collectPlaces<T>(items: T[], placeFields: (item: T) => (string | null | undefined)[]): string[] {
  const set = new Set<string>()
  for (const item of items) for (const p of placeFields(item)) if (p && p.trim()) set.add(p.trim())
  return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
}

export default function ListToolbar({
  id, filters, onChange, searchPlaceholder, placePlaceholder, places, total, shown,
}: {
  id: string
  filters: ListFilters
  onChange: (f: ListFilters) => void
  searchPlaceholder: string
  placePlaceholder: string
  places: string[]
  total: number
  shown: number
}) {
  const set = <K extends keyof ListFilters>(k: K, v: ListFilters[K]) => onChange({ ...filters, [k]: v })
  const active = filters.search || filters.place || filters.period !== 'all' || filters.sort !== 'recent'
  const inp = 'border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-orange-400 transition-colors'

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 mb-4 flex flex-wrap items-center gap-2">
      <input
        className={`${inp} flex-1 min-w-[180px]`}
        placeholder={`🔎 ${searchPlaceholder}`}
        value={filters.search}
        onChange={e => set('search', e.target.value)}
      />
      <input
        className={`${inp} flex-1 min-w-[160px]`}
        placeholder={`📍 ${placePlaceholder}`}
        list={`${id}-places`}
        value={filters.place}
        onChange={e => set('place', e.target.value)}
      />
      <datalist id={`${id}-places`}>
        {places.map(p => <option key={p} value={p} />)}
      </datalist>
      <select className={inp} value={filters.period} onChange={e => set('period', e.target.value as PeriodKey)} title="Date d'ajout">
        <option value="all">📅 Toutes les dates</option>
        <option value="7">Ajoutés depuis 7 jours</option>
        <option value="30">Ajoutés depuis 30 jours</option>
        <option value="90">Ajoutés depuis 3 mois</option>
        <option value="365">Ajoutés depuis 1 an</option>
      </select>
      <select className={inp} value={filters.sort} onChange={e => set('sort', e.target.value as SortKey)} title="Trier par">
        <option value="recent">↓ Plus récents d&apos;abord</option>
        <option value="oldest">↑ Plus anciens d&apos;abord</option>
        <option value="az">A → Z</option>
        <option value="za">Z → A</option>
      </select>
      {active && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="text-sm text-gray-400 hover:text-gray-700 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
          ✕ Réinitialiser
        </button>
      )}
      {active && <span className="text-xs text-gray-400 w-full sm:w-auto">{shown} / {total} affiché{shown > 1 ? 's' : ''}</span>}
    </div>
  )
}
