import { useState, type FormEvent } from 'react'
import { ArtworkCard } from './components/ArtworkCard'
import { CardGrid } from './components/CardGrid'
import { Interpretation } from './components/Interpretation'
import { ReadingForm } from './components/ReadingForm'
import { DEFAULT_MODEL, type ModelId } from './lib/models'
import { parseReadingStream } from './lib/parseReading'
import { SPREADS } from './lib/spreads'
import type { DrawnCard, MediumId, SpreadId, StreamEvent } from './lib/types'

type Status = 'idle' | 'drawing' | 'interpreting' | 'done' | 'error'

export default function App() {
  const [question, setQuestion] = useState('')
  const [spreadId, setSpreadId] = useState<SpreadId>('three')
  const [medium, setMedium] = useState<MediumId>('any')
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL)
  const [cards, setCards] = useState<DrawnCard[]>([])
  const [interpretation, setInterpretation] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [asked, setAsked] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = question.trim()
    if (!trimmed || status === 'drawing' || status === 'interpreting') return

    setStatus('drawing')
    setError('')
    setCards([])
    setInterpretation('')
    setAsked(trimmed)

    try {
      const response = await fetch('/api/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed, spread: spreadId, medium, model }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        throw new Error(payload?.error || `Request failed (${response.status})`)
      }

      if (!response.body) {
        throw new Error('No response stream from the server')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          const event = JSON.parse(line) as StreamEvent
          if (event.type === 'cards') {
            setCards(event.cards)
            setStatus('interpreting')
          } else if (event.type === 'token') {
            setInterpretation((current) => current + event.text)
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }
      }

      if (buffer.trim()) {
        const event = JSON.parse(buffer) as StreamEvent
        if (event.type === 'error') throw new Error(event.message)
        if (event.type === 'token') {
          setInterpretation((current) => current + event.text)
        }
      }

      setStatus('done')
    } catch (caught) {
      setStatus('error')
      setError(caught instanceof Error ? caught.message : 'Something went wrong')
    }
  }

  const busy = status === 'drawing' || status === 'interpreting'
  const spread = SPREADS[spreadId]
  const parsed = parseReadingStream(interpretation, cards.length, status === 'done')
  const showSummary =
    Boolean(parsed.summary) ||
    (status === 'interpreting' && parsed.streamingTarget?.type === 'summary')

  return (
    <div className="page">
      <header className="masthead">
        <p className="eyebrow">Cleveland Museum of Art · Open Access</p>
        <h1>Museum Tarot</h1>
        <p className="lede">
          Ask a question. A spread is drawn from public-domain works in the
          collection, then read together as cards.
        </p>
      </header>

      <ReadingForm
        question={question}
        spreadId={spreadId}
        medium={medium}
        model={model}
        busy={busy}
        onQuestion={setQuestion}
        onSpread={setSpreadId}
        onMedium={setMedium}
        onModel={setModel}
        onSubmit={onSubmit}
      />

      {status === 'drawing' && (
        <p className="status" role="status">
          Drawing {spread.positions.length} work
          {spread.positions.length === 1 ? '' : 's'} from the collection…
        </p>
      )}

      {cards.length > 0 && (
        <section className="reading" aria-live="polite">
          {asked && (
            <p className="asked">
              <span>Question</span>
              {asked}
            </p>
          )}
          <CardGrid>
            {cards.map((card, index) => (
              <ArtworkCard
                key={`${card.id}-${card.position}`}
                card={card}
                reading={parsed.cardTexts[index]}
                streaming={
                  status === 'interpreting' &&
                  parsed.streamingTarget?.type === 'card' &&
                  parsed.streamingTarget.index === index
                }
              />
            ))}
          </CardGrid>
        </section>
      )}

      {showSummary && (
        <Interpretation
          text={parsed.summary}
          streaming={status === 'interpreting' && parsed.streamingTarget?.type === 'summary'}
        />
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <footer className="colophon">
        Images and catalog data courtesy of the Cleveland Museum of Art, CC0.
        Readings are interpretive, not fortune-telling.
      </footer>
    </div>
  )
}
