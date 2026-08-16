export type SpreadId = 'single' | 'three' | 'five' | 'celtic'
export type MediumId = 'any' | 'painting' | 'photograph' | 'drawing'

export type SpreadPosition = {
  name: string
  meaning: string
  area: string
}

export type SpreadDefinition = {
  id: SpreadId
  label: string
  description: string
  positions: SpreadPosition[]
}

export type DrawnCard = {
  id: number
  imageUrl: string
  title: string
  artist: string
  date: string
  technique: string
  type: string
  url: string
  tombstone: string
  position: string
  positionMeaning: string
  area: string
  reversed: boolean
}

export type ReadingRequest = {
  question: string
  spread: SpreadId
  medium: MediumId
  model: string
}

export type StreamEvent =
  | { type: 'cards'; cards: DrawnCard[]; spread: SpreadId }
  | { type: 'token'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string }
