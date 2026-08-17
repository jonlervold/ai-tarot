import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { config } from 'dotenv'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { drawArtworks } from './cleveland.ts'
import { buildReadingZip, type ExportRequest } from './export.ts'
import { interpretReading } from './interpret.ts'
import { getSpread } from '../src/lib/spreads.ts'
import { isModelId } from '../src/lib/models.ts'
import type { DrawnCard, MediumId, ReadingRequest, StreamEvent } from '../src/lib/types.ts'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
config({ path: join(rootDir, '.env') })

const PORT = Number(process.env.PORT) || 3001
const distDir = join(rootDir, 'dist')
const MEDIUMS: MediumId[] = ['any', 'painting', 'photograph', 'drawing']

const app = new Hono()
app.use('/api/*', cors())

app.get('/api/health', (c) => c.json({ ok: true }))

app.post('/api/reading', async (c) => {
  let body: ReadingRequest
  try {
    body = (await c.req.json()) as ReadingRequest
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const question = body.question?.trim()
  const spread = getSpread(body.spread)
  const medium = body.medium
  const model = body.model

  if (!question) {
    return c.json({ error: 'A question is required' }, 400)
  }
  if (!spread) {
    return c.json({ error: 'Unknown spread type' }, 400)
  }
  if (!MEDIUMS.includes(medium)) {
    return c.json({ error: 'Unknown medium' }, 400)
  }
  if (!model || !isModelId(model)) {
    return c.json({ error: 'Unknown model' }, 400)
  }
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return c.json(
      { error: 'OPENAI_API_KEY is missing. Copy .env.example to .env and add your key.' },
      500,
    )
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
      }

      try {
        const artworks = await drawArtworks(spread.positions.length, medium)
        const cards: DrawnCard[] = artworks.map((artwork, index) => {
          const position = spread.positions[index]!
          return {
            ...artwork,
            position: position.name,
            positionMeaning: position.meaning,
            area: position.area,
            reversed: Math.random() < 0.5,
          }
        })

        send({ type: 'cards', cards, spread: spread.id })

        for await (const text of interpretReading(question, spread.label, cards, model)) {
          send({ type: 'token', text })
        }

        send({ type: 'done' })
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Reading failed. Try again.'
        send({ type: 'error', message })
      } finally {
        controller.close()
      }
    },
  })

  return c.newResponse(readable, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
})

app.post('/api/export', async (c) => {
  let body: ExportRequest
  try {
    body = (await c.req.json()) as ExportRequest
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.question?.trim() || !Array.isArray(body.cards) || body.cards.length === 0) {
    return c.json({ error: 'A completed reading is required to export' }, 400)
  }

  try {
    const { zip, filename } = await buildReadingZip({
      question: body.question.trim(),
      spreadLabel: body.spreadLabel?.trim() || 'Reading',
      cards: body.cards,
      cardTexts: Array.isArray(body.cardTexts) ? body.cardTexts : [],
      summary: body.summary ?? '',
    })
    return c.body(zip, 200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed'
    return c.json({ error: message }, 500)
  }
})

if (existsSync(distDir)) {
  app.use('/*', serveStatic({ root: './dist' }))
  app.notFound(async (c) => {
    if (c.req.path.startsWith('/api/')) {
      return c.json({ error: 'Not found' }, 404)
    }
    const html = await readFile(join(distDir, 'index.html'), 'utf8')
    return c.html(html)
  })
}

serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  const keyLoaded = Boolean(process.env.OPENAI_API_KEY?.trim())
  console.log(`Listening on http://0.0.0.0:${info.port}`)
  console.log(keyLoaded ? 'OPENAI_API_KEY loaded' : 'OPENAI_API_KEY is missing')
})
