export const MODELS = [
  {
    id: 'gpt-5.6',
    label: 'GPT-5.6 Sol',
    description: 'Current flagship. Strongest reading of images and the spread as a whole.',
  },
  {
    id: 'gpt-5.6-terra',
    label: 'GPT-5.6 Terra',
    description: 'Near-flagship, usually a bit faster.',
  },
  {
    id: 'gpt-5.5',
    label: 'GPT-5.5',
    description: 'Previous frontier generation. Still excellent with images.',
  },
  {
    id: 'gpt-4.1',
    label: 'GPT-4.1',
    description: 'Older vision model. Use if a 5.x model is unavailable on your key.',
  },
] as const

export type ModelId = (typeof MODELS)[number]['id']

export const DEFAULT_MODEL: ModelId = 'gpt-5.6'

export function isModelId(value: string): value is ModelId {
  return MODELS.some((model) => model.id === value)
}
