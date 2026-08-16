import type { DrawnCard } from '../lib/types'
import { MarkdownBody } from './MarkdownBody'

type Props = {
  card: DrawnCard
  reading?: string
  streaming?: boolean
}

export function ArtworkCard({ card, reading, streaming }: Props) {
  return (
    <article className="artwork-card">
      <header className="artwork-meta">
        <h2>{card.position}</h2>
        {card.reversed && <span className="reversed">Reversed</span>}
      </header>
      <figure>
        <div className="frame">
          <img src={card.imageUrl} alt={card.title} />
        </div>
        <figcaption>
          <a href={card.url} target="_blank" rel="noreferrer">
            {card.title}
          </a>
          <span>
            {card.artist}, {card.date}
          </span>
          <span className="technique">
            {card.type}
            {card.technique ? ` · ${card.technique}` : ''}
          </span>
        </figcaption>
      </figure>
      {(reading || streaming) && (
        <div className={`card-reading${streaming ? ' streaming' : ''}`}>
          {reading ? (
            <MarkdownBody text={reading} />
          ) : (
            <p className="card-reading-pending">Reading this card…</p>
          )}
        </div>
      )}
    </article>
  )
}
