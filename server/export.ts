import JSZip from 'jszip'
import type { DrawnCard } from '../src/lib/types.ts'

export type ExportRequest = {
  question: string
  spreadLabel: string
  cards: DrawnCard[]
  cardTexts: string[]
  summary: string
}

const ALLOWED_HOSTS = new Set([
  'openaccess-cdn.clevelandart.org',
  'clevelandart.org',
  'www.clevelandart.org',
])

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function slug(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return cleaned || 'card'
}

function markdownToHtml(text: string): string {
  if (!text.trim()) return ''
  return text
    .split('\n')
    .map((line) => {
      if (line.trim() === '') return '<div class="break"></div>'
      let body = escapeHtml(line).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      if (line.startsWith('### ')) {
        return `<h4>${body.slice(4)}</h4>`
      }
      if (line.startsWith('## ')) {
        return `<h3>${body.slice(3)}</h3>`
      }
      if (line.startsWith('# ')) {
        return `<h3>${body.slice(2)}</h3>`
      }
      return `<p>${body}</p>`
    })
    .join('\n')
}

function extensionFor(contentType: string | null, url: string): string {
  const type = contentType?.split(';')[0]?.trim().toLowerCase()
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  if (type === 'image/gif') return 'gif'
  if (type === 'image/jpeg' || type === 'image/jpg') return 'jpg'
  const fromUrl = url.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i)?.[1]
  if (fromUrl === 'jpeg') return 'jpg'
  if (fromUrl) return fromUrl.toLowerCase()
  return 'jpg'
}

function isAllowedImageUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && ALLOWED_HOSTS.has(url.hostname)
  } catch {
    return false
  }
}

async function fetchImage(
  imageUrl: string,
): Promise<{ bytes: Uint8Array; extension: string } | null> {
  if (!isAllowedImageUrl(imageUrl)) return null
  try {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(20_000),
      headers: { 'User-Agent': 'ai-tarot-export/1.0' },
    })
    if (!response.ok) return null
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (bytes.byteLength === 0) return null
    return { bytes, extension: extensionFor(response.headers.get('content-type'), imageUrl) }
  } catch {
    return null
  }
}

function buildHtml(input: {
  question: string
  spreadLabel: string
  cards: Array<DrawnCard & { localSrc: string | null; reading: string }>
  summary: string
  exportedAt: string
}): string {
  const cardsHtml = input.cards
    .map((card) => {
      const image = card.localSrc
        ? `<img src="${escapeHtml(card.localSrc)}" alt="${escapeHtml(card.title)}" />`
        : '<p class="missing">Image could not be saved locally.</p>'
      const reversed = card.reversed ? '<span class="reversed">Reversed</span>' : ''
      const museum = card.url
        ? `<a href="${escapeHtml(card.url)}">${escapeHtml(card.title)}</a>`
        : escapeHtml(card.title)
      return `<article class="card">
  <header>
    <h2>${escapeHtml(card.position)}</h2>
    ${reversed}
  </header>
  <figure>
    <div class="frame">${image}</div>
    <figcaption>
      ${museum}
      <span>${escapeHtml(`${card.artist}, ${card.date}`)}</span>
      <span class="technique">${escapeHtml(
        card.technique ? `${card.type} · ${card.technique}` : card.type,
      )}</span>
    </figcaption>
  </figure>
  <div class="reading">${markdownToHtml(card.reading)}</div>
</article>`
    })
    .join('\n')

  const summaryHtml = input.summary.trim()
    ? `<section class="summary">
  <h2>Summary</h2>
  ${markdownToHtml(input.summary)}
</section>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Museum Tarot — ${escapeHtml(input.question.slice(0, 80))}</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #0e0c0a;
      color: #efe6d6;
      font-family: Georgia, "Times New Roman", serif;
      line-height: 1.55;
    }
    .page { width: min(40rem, calc(100% - 2.5rem)); margin: 0 auto; padding: 3rem 0 5rem; }
    .eyebrow { letter-spacing: 0.18em; text-transform: uppercase; font-size: 0.72rem; color: #c4a574; font-family: "Segoe UI", sans-serif; }
    h1 { font-size: 2.6rem; font-weight: 600; margin: 0.4rem 0 1.5rem; }
    .asked span { display: block; letter-spacing: 0.14em; text-transform: uppercase; font-size: 0.72rem; color: #c4a574; font-family: "Segoe UI", sans-serif; margin-bottom: 0.35rem; }
    .asked { font-size: 1.45rem; margin: 0 0 2.5rem; }
    .card { margin: 0 0 3.25rem; }
    .card header { display: flex; justify-content: space-between; align-items: baseline; gap: 0.6rem; margin-bottom: 0.55rem; }
    .card h2 { margin: 0; font-size: 1.55rem; font-weight: 600; }
    .reversed { border: 1px solid #c4a574; color: #c4a574; font-size: 0.68rem; letter-spacing: 0.14em; text-transform: uppercase; padding: 0.18rem 0.4rem; font-family: "Segoe UI", sans-serif; }
    .frame { display: flex; align-items: center; justify-content: center; min-height: 12rem; padding: 0.7rem; background: #090807; border: 1px solid #8d7349; }
    .frame img { width: 100%; max-height: 32rem; object-fit: contain; display: block; }
    figcaption { display: grid; gap: 0.15rem; margin-top: 0.65rem; font-size: 0.88rem; color: #b7aa96; font-family: "Segoe UI", sans-serif; }
    figcaption a { color: #efe6d6; text-decoration: none; font-family: Georgia, serif; font-size: 1.05rem; }
    .reading, .summary { margin-top: 1.15rem; font-size: 1.05rem; color: #e7dcc8; }
    .reading p, .summary p { margin: 0.15rem 0 0; }
    .break { height: 0.7rem; }
    .summary { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid rgba(196, 165, 116, 0.28); }
    .summary h2 { font-size: 2rem; margin: 0 0 1rem; }
    .colophon { margin-top: 4rem; color: #b7aa96; font-size: 0.85rem; font-family: "Segoe UI", sans-serif; }
    .missing { color: #b7aa96; font-family: "Segoe UI", sans-serif; }
  </style>
</head>
<body>
  <div class="page">
    <p class="eyebrow">Cleveland Museum of Art · ${escapeHtml(input.spreadLabel)} · ${escapeHtml(input.exportedAt)}</p>
    <h1>Museum Tarot</h1>
    <p class="asked"><span>Question</span>${escapeHtml(input.question)}</p>
    ${cardsHtml}
    ${summaryHtml}
    <p class="colophon">Images and catalog data courtesy of the Cleveland Museum of Art, CC0. Readings are interpretive, not fortune-telling. This file is a local snapshot; open it next to the images folder.</p>
  </div>
</body>
</html>
`
}

export async function buildReadingZip(input: ExportRequest): Promise<{ zip: Uint8Array; filename: string }> {
  const zip = new JSZip()
  const images = zip.folder('images')
  if (!images) throw new Error('Could not create images folder')

  const cards = await Promise.all(
    input.cards.map(async (card, index) => {
      const fetched = await fetchImage(card.imageUrl)
      const prefix = String(index + 1).padStart(2, '0')
      let localSrc: string | null = null
      if (fetched) {
        const filename = `${prefix}-${slug(card.position)}.${fetched.extension}`
        images.file(filename, fetched.bytes)
        localSrc = `images/${filename}`
      }
      return {
        ...card,
        localSrc,
        reading: input.cardTexts[index] ?? '',
      }
    }),
  )

  const exportedAt = new Date().toISOString().slice(0, 10)
  zip.file(
    'reading.html',
    buildHtml({
      question: input.question,
      spreadLabel: input.spreadLabel,
      cards,
      summary: input.summary,
      exportedAt,
    }),
  )

  const zipBytes = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  const filename = `museum-tarot-${exportedAt}-${slug(input.question)}.zip`
  return { zip: zipBytes, filename }
}
