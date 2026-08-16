import type { SpreadDefinition, SpreadId } from './types'

export const SPREADS: Record<SpreadId, SpreadDefinition> = {
  single: {
    id: 'single',
    label: 'Single card',
    description: 'One work as the heart of the answer.',
    positions: [
      {
        name: 'The Card',
        meaning: 'The core of the matter — the clearest image of the question as it stands now.',
        area: 'center',
      },
    ],
  },
  three: {
    id: 'three',
    label: 'Three-card',
    description: 'Past, present, and future.',
    positions: [
      {
        name: 'Past',
        meaning: 'What led here — roots, residue, and the story already in motion.',
        area: 'left',
      },
      {
        name: 'Present',
        meaning: 'The situation as it lives now, including what is asked of the querent.',
        area: 'center',
      },
      {
        name: 'Future',
        meaning: 'The direction this is tending unless something essential changes.',
        area: 'right',
      },
    ],
  },
  five: {
    id: 'five',
    label: 'Five-card',
    description: 'Situation, challenge, advice, near future, and outcome.',
    positions: [
      {
        name: 'Situation',
        meaning: 'The field of the question — what is actually happening.',
        area: 'p1',
      },
      {
        name: 'Challenge',
        meaning: 'The friction, blind spot, or opposing force at work.',
        area: 'p2',
      },
      {
        name: 'Advice',
        meaning: 'The most useful stance, action, or inner shift.',
        area: 'p3',
      },
      {
        name: 'Near future',
        meaning: 'What is likely to unfold next if this path continues.',
        area: 'p4',
      },
      {
        name: 'Outcome',
        meaning: 'Where this tends if the advice is taken seriously.',
        area: 'p5',
      },
    ],
  },
  celtic: {
    id: 'celtic',
    label: 'Celtic Cross',
    description: 'Ten positions: a cross of the present, and a staff of becoming.',
    positions: [
      {
        name: 'The Present',
        meaning: 'The heart of the situation — how the question lives right now.',
        area: 'present',
      },
      {
        name: 'The Challenge',
        meaning: 'What crosses the present: obstacle, catalyst, or the thing that must be met.',
        area: 'challenge',
      },
      {
        name: 'The Root',
        meaning: 'The foundation beneath awareness — origin, unconscious ground, deeper cause.',
        area: 'root',
      },
      {
        name: 'The Recent Past',
        meaning: 'What is receding, but still coloring the present.',
        area: 'past',
      },
      {
        name: 'The Crown',
        meaning: 'The conscious aim, best possible flowering, or what the querent is reaching toward.',
        area: 'crown',
      },
      {
        name: 'The Near Future',
        meaning: 'The next movement, approaching weather, or imminent turn.',
        area: 'future',
      },
      {
        name: 'The Self',
        meaning: 'The querent’s stance, self-image, or how they occupy this story.',
        area: 'self',
      },
      {
        name: 'The Environment',
        meaning: 'Other people, context, and the atmosphere around the question.',
        area: 'environment',
      },
      {
        name: 'Hopes and Fears',
        meaning: 'What is longed for and what is dreaded — often the same shape, seen twice.',
        area: 'hopes',
      },
      {
        name: 'The Outcome',
        meaning: 'The likely culmination if nothing essential is refused.',
        area: 'outcome',
      },
    ],
  },
}

export const SPREAD_LIST = Object.values(SPREADS)

export function getSpread(id: string): SpreadDefinition | undefined {
  if (id in SPREADS) return SPREADS[id as SpreadId]
  return undefined
}
