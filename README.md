# Half Glass News

A full-stack React + Node app that fetches recent headlines and rewrites a selected story in either a positive or negative tone based on user mood.

## Stack
- React (Vite) frontend
- Express backend API
- NewsAPI for recent headlines
- Azure OpenAI deployment in Azure AI Foundry for spin generation

## Prerequisites
- Node.js 20+
- npm 10+
- NewsAPI key
- Azure OpenAI endpoint + deployment + key

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create your environment file:
   ```bash
   cp .env.example .env
   ```
3. Fill in `.env` values:
   - `NEWS_API_KEY`
   - `AZURE_OPENAI_ENDPOINT` (for example `https://<resource>.openai.azure.com`)
   - `AZURE_OPENAI_DEPLOYMENT` (your deployed chat model name)
   - `AZURE_OPENAI_API_KEY`
   - Optionally change `AZURE_OPENAI_API_VERSION`

## Run in development
```bash
npm run dev
```
- React UI: `http://localhost:5173`
- API: `http://localhost:8787`

## API endpoints
- `GET /api/news?limit=9` -> latest stories
- `POST /api/spin` -> generate positive/negative framing

Request body for `/api/spin`:
```json
{
  "title": "Story title",
  "description": "Story summary",
  "url": "https://example.com/story",
  "mood": "positive"
}
```

## Notes
- The app intentionally asks the model to preserve factual accuracy and only adjust tone.
- You can swap news providers by changing `GET /api/news` in `server/src/index.js`.
