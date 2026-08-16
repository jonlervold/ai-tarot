import { MarkdownBody } from './MarkdownBody'

type Props = {
  text: string
  streaming: boolean
}

export function Interpretation({ text, streaming }: Props) {
  if (!text && !streaming) return null

  return (
    <section className={`interpretation${streaming ? ' streaming' : ''}`}>
      <h2>Summary</h2>
      <div className="interpretation-body">
        {text ? (
          <MarkdownBody text={text} />
        ) : (
          <p className="card-reading-pending">Gathering the spread…</p>
        )}
      </div>
    </section>
  )
}
