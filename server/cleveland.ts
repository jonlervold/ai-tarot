import type { MediumId } from '../src/lib/types.ts'

const CMA_URL = 'https://openaccess-api.clevelandart.org/api/artworks/'
const FIELDS = 'id,title,creators,creation_date,technique,type,url,tombstone,images'
const USER_AGENT = 'ai-tarot/0.1 (local educational project)'

const TWO_D_TYPES = ['Painting', 'Photograph', 'Drawing', 'Print'] as const
type ArtworkType = (typeof TWO_D_TYPES)[number]

type ClevelandCreator = {
  description?: string | null
}

type ClevelandArtwork = {
  id: number
  title?: string | null
  creation_date?: string | null
  technique?: string | null
  type?: string | null
  url?: string | null
  tombstone?: string | null
  creators?: ClevelandCreator[] | null
  images?: { web?: { url?: string | null } | null } | null
}

type ClevelandResponse = {
  info?: { total?: number }
  data?: ClevelandArtwork[]
}

export type MuseumArtwork = {
  id: number
  imageUrl: string
  title: string
  artist: string
  date: string
  technique: string
  type: string
  url: string
  tombstone: string
}

const totalCache = new Map<ArtworkType, { total: number; fetchedAt: number }>()
const TOTAL_TTL_MS = 1000 * 60 * 60

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

function resolveType(medium: MediumId): ArtworkType {
  if (medium === 'painting') return 'Painting'
  if (medium === 'photograph') return 'Photograph'
  if (medium === 'drawing') return pick(['Drawing', 'Print'] as const)
  return pick(TWO_D_TYPES)
}

async function cmaFetch(params: URLSearchParams): Promise<ClevelandResponse> {
  const url = `${CMA_URL}?${params.toString()}`
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) {
    throw new Error(`Cleveland Museum API returned ${response.status}`)
  }
  return (await response.json()) as ClevelandResponse
}

async function getTotal(type: ArtworkType): Promise<number> {
  const cached = totalCache.get(type)
  if (cached && Date.now() - cached.fetchedAt < TOTAL_TTL_MS) {
    return cached.total
  }

  const params = new URLSearchParams({
    cc0: '1',
    has_image: '1',
    type,
    limit: '1',
    fields: 'id',
  })
  const json = await cmaFetch(params)
  const total = json.info?.total ?? 0
  if (total < 1) {
    throw new Error(`No CC0 images found for type ${type}`)
  }
  totalCache.set(type, { total, fetchedAt: Date.now() })
  return total
}

function mapArtwork(raw: ClevelandArtwork): MuseumArtwork | null {
  const imageUrl = raw.images?.web?.url
  if (!imageUrl) return null
  return {
    id: raw.id,
    imageUrl,
    title: raw.title?.trim() || 'Untitled',
    artist: raw.creators?.[0]?.description?.trim() || 'Unknown artist',
    date: raw.creation_date?.trim() || 'Date unknown',
    technique: raw.technique?.trim() || 'Medium unknown',
    type: raw.type?.trim() || 'Artwork',
    url: raw.url?.trim() || `https://www.clevelandart.org/art/${raw.id}`,
    tombstone: raw.tombstone?.trim() || '',
  }
}

async function fetchRandomArtwork(type: ArtworkType): Promise<MuseumArtwork> {
  const total = await getTotal(type)
  const skip = Math.floor(Math.random() * total)
  const params = new URLSearchParams({
    cc0: '1',
    has_image: '1',
    type,
    skip: String(skip),
    limit: '1',
    fields: FIELDS,
  })
  const json = await cmaFetch(params)
  const mapped = json.data?.[0] ? mapArtwork(json.data[0]) : null
  if (!mapped) {
    throw new Error('Random artwork was missing an image')
  }
  return mapped
}

export async function drawArtworks(
  count: number,
  medium: MediumId,
): Promise<MuseumArtwork[]> {
  const used = new Set<number>()
  const artworks: MuseumArtwork[] = []
  let attempts = 0
  const maxAttempts = count * 10

  while (artworks.length < count && attempts < maxAttempts) {
    attempts += 1
    try {
      const artwork = await fetchRandomArtwork(resolveType(medium))
      if (used.has(artwork.id)) continue
      used.add(artwork.id)
      artworks.push(artwork)
    } catch {
      // Retry: totals can shift, or a record can lack a usable web image.
    }
  }

  if (artworks.length < count) {
    throw new Error('Could not draw enough unique artworks from the museum')
  }

  return artworks
}
