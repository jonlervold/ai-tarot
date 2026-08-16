import OpenAI, { APIError } from 'openai'
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions'
import type { DrawnCard } from '../src/lib/types.ts'

const SYSTEM_PROMPT = `You are a thoughtful tarot reader who uses public-domain museum artworks as cards instead of a traditional deck.

Interpret the visual content of each artwork together with its catalog metadata, its position in the spread, and whether it is reversed. "Reversed" does not mean the image is upside down — it means that card's energy is inverted, blocked, internalized, delayed, or turned inward.

Write in clear, grounded, evocative prose. Do not claim supernatural certainty or predict medical, legal, or financial outcomes as fact.

Output ONLY this exact format, with no title, preamble, or markdown headings. Use the card indices given to you (starting at 0). Write 1-3 short paragraphs per card, then a summary that weaves the whole spread together and answers the question.

<<<CARD:0>>>
Interpretation of card 0 for the question.

<<<CARD:1>>>
Interpretation of card 1 for the question.

<<<SUMMARY>>>
A closing synthesis of all cards together.`

function imageDetail(cardCount: number): 'low' | 'auto' {
  return cardCount >= 8 ? 'low' : 'auto'
}

function cardText(card: DrawnCard, index: number): string {
  return [
    `Card ${index + 1}`,
    `Position: ${card.position}`,
    `Position meaning: ${card.positionMeaning}`,
    `Orientation: ${card.reversed ? 'Reversed' : 'Upright'}`,
    `Title: ${card.title}`,
    `Artist: ${card.artist}`,
    `Date: ${card.date}`,
    `Type: ${card.type}`,
    `Medium / technique: ${card.technique}`,
    card.tombstone ? `Museum tombstone: ${card.tombstone}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export async function* interpretReading(
  question: string,
  spreadLabel: string,
  cards: DrawnCard[],
  model: string,
): AsyncGenerator<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is missing. Add it to your .env file.')
  }

  const client = new OpenAI({ apiKey })
  const detail = imageDetail(cards.length)

  const userContent: ChatCompletionContentPart[] = [
    {
      type: 'text',
      text: `Question: ${question}\nSpread: ${spreadLabel}\n\nRead the following ${cards.length} museum artworks as a tarot spread. Look at each image.\nEmit <<<CARD:0>>> through <<<CARD:${cards.length - 1}>>> in order, then <<<SUMMARY>>>.`,
    },
  ]

  for (const [index, card] of cards.entries()) {
    userContent.push({ type: 'text', text: cardText(card, index) })
    userContent.push({
      type: 'image_url',
      image_url: { url: card.imageUrl, detail },
    })
  }

  let stream
  try {
    stream = await client.chat.completions.create({
      model,
      stream: true,
      max_completion_tokens: 4000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    })
  } catch (error) {
    throw describeOpenAiError(error)
  }

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content
    if (text) yield text
  }
}

function describeOpenAiError(error: unknown): Error {
  if (error instanceof APIError && error.status === 429) {
    return new Error(
      'OpenAI quota exceeded. Add prepaid API credit at https://platform.openai.com/settings/organization/billing — ChatGPT Pro does not cover API usage. Then try the reading again.',
    )
  }
  if (error instanceof Error) return error
  return new Error('OpenAI request failed')
}
