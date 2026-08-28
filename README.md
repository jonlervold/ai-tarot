# AI Tarot (Museum Tarot)

A tarot reading app that uses real, public-domain artworks from the Cleveland Museum of Art as the "deck" instead of traditional tarot cards. Ask a question, pick a spread, and an AI vision model interprets the paintings/photographs/drawings you drew as if they were tarot cards.

## How it works

1. **Frontend** (`src/`) - a React + Vite app where you type a question, choose a spread (single card, three-card, five-card, or Celtic Cross) and a preferred artwork medium.
2. **Draw artworks** (`server/cleveland.ts`) - the backend randomly draws unique, CC0-licensed artworks from the [Cleveland Museum of Art Open Access API](https://openaccess-api.clevelandart.org/), one per spread position, and randomly marks each as upright or reversed.
3. **Interpret** (`server/interpret.ts`) - the drawn artwork images and their catalog metadata (title, artist, date, technique) are sent to an OpenAI vision model along with your question and the spread's position meanings. The model streams back a per-card interpretation plus a closing summary.
4. **Streaming** (`server/index.ts`) - the backend is a small [Hono](https://hono.dev/) server that streams the drawn cards and the AI's response tokens to the browser as newline-delimited JSON, so the reading appears live as it's written.
5. **Export** (`server/export.ts`) - once a reading is complete, you can download it as a self-contained `.zip` with an HTML page and the saved artwork images.

## Running it

**Requirements:** Node.js 22+, and an [OpenAI API key](https://platform.openai.com/api-keys) with billing/credit enabled.

```bash
npm install
cp .env.example .env   # then add your OPENAI_API_KEY
npm run dev
```

This starts the Vite dev server (frontend) and the API server together. Open the URL Vite prints (usually `http://localhost:5173`).

### Production build

```bash
npm run build
npm start
```

### Docker

```bash
docker compose up --build
```

The app will be available at `http://localhost:3000`. Make sure `.env` exists first (`docker-compose.yml` loads it via `env_file`).
