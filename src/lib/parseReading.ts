export type StreamTarget =
  | { type: 'card'; index: number }
  | { type: 'summary' }

export type ParsedReading = {
  cardTexts: string[]
  summary: string
  streamingTarget: StreamTarget | null
}

const CARD_MARKER = /<<<CARD:(\d+)>>>/g
const SUMMARY_MARKER = '<<<SUMMARY>>>'

export function parseReadingStream(
  raw: string,
  cardCount: number,
  complete = false,
): ParsedReading {
  const cardTexts = Array.from({ length: cardCount }, () => '')
  let summary = ''
  let streamingTarget: StreamTarget | null = null

  if (!raw.includes('<<<CARD:') && !raw.includes(SUMMARY_MARKER)) {
    return {
      cardTexts,
      summary: complete ? raw : '',
      streamingTarget: complete && raw ? { type: 'summary' } : null,
    }
  }

  type Marker = {
    kind: 'card' | 'summary'
    index?: number
    contentStart: number
    start: number
  }

  const markers: Marker[] = []
  for (const match of raw.matchAll(CARD_MARKER)) {
    markers.push({
      kind: 'card',
      index: Number(match[1]),
      start: match.index ?? 0,
      contentStart: (match.index ?? 0) + match[0].length,
    })
  }

  const summaryAt = raw.indexOf(SUMMARY_MARKER)
  if (summaryAt >= 0) {
    markers.push({
      kind: 'summary',
      start: summaryAt,
      contentStart: summaryAt + SUMMARY_MARKER.length,
    })
  }

  markers.sort((a, b) => a.start - b.start)

  for (let i = 0; i < markers.length; i++) {
    const marker = markers[i]!
    const isLast = i === markers.length - 1
    const end = isLast ? raw.length : markers[i + 1]!.start
    const content = isLast
      ? raw.slice(marker.contentStart, end).replace(/^\s+/, '')
      : raw.slice(marker.contentStart, end).trim()

    if (marker.kind === 'card' && marker.index != null) {
      if (marker.index >= 0 && marker.index < cardCount) {
        cardTexts[marker.index] = content
      }
    } else {
      summary = content
    }

    if (isLast) {
      streamingTarget =
        marker.kind === 'card' && marker.index != null
          ? { type: 'card', index: marker.index }
          : { type: 'summary' }
    }
  }

  return { cardTexts, summary, streamingTarget }
}
