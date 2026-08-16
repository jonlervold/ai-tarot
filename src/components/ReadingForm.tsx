import type { FormEvent } from 'react'
import { MEDIUMS } from '../lib/mediums'
import { MODELS, type ModelId } from '../lib/models'
import { SPREAD_LIST } from '../lib/spreads'
import type { MediumId, SpreadId } from '../lib/types'

type Props = {
  question: string
  spreadId: SpreadId
  medium: MediumId
  model: ModelId
  busy: boolean
  onQuestion: (value: string) => void
  onSpread: (value: SpreadId) => void
  onMedium: (value: MediumId) => void
  onModel: (value: ModelId) => void
  onSubmit: (event: FormEvent) => void
}

export function ReadingForm({
  question,
  spreadId,
  medium,
  model,
  busy,
  onQuestion,
  onSpread,
  onMedium,
  onModel,
  onSubmit,
}: Props) {
  return (
    <form className="reading-form" onSubmit={onSubmit}>
      <label className="field">
        <span>Your question</span>
        <textarea
          value={question}
          onChange={(event) => onQuestion(event.target.value)}
          rows={4}
          required
          maxLength={2000}
          placeholder="What is this asking of me right now?"
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Spread</span>
          <select
            value={spreadId}
            onChange={(event) => onSpread(event.target.value as SpreadId)}
          >
            {SPREAD_LIST.map((spread) => (
              <option key={spread.id} value={spread.id}>
                {spread.label} ({spread.positions.length})
              </option>
            ))}
          </select>
          <em>{SPREAD_LIST.find((spread) => spread.id === spreadId)?.description}</em>
        </label>

        <label className="field">
          <span>Works to draw from</span>
          <select
            value={medium}
            onChange={(event) => onMedium(event.target.value as MediumId)}
          >
            {MEDIUMS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <em>Each card is a random CC0 work of this kind.</em>
        </label>
      </div>

      <label className="field">
        <span>Model</span>
        <select
          value={model}
          onChange={(event) => onModel(event.target.value as ModelId)}
        >
          {MODELS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <em>{MODELS.find((item) => item.id === model)?.description}</em>
      </label>

      <button type="submit" disabled={busy || !question.trim()}>
        {busy ? 'Reading…' : 'Draw the spread'}
      </button>
    </form>
  )
}
