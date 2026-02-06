# SmartDoc Analyst

RAG (Retrieval Augmented Generation) application for document analysis, built with NX monorepo.

## Structure

```
smartdoc-analyst/
├── apps/
│   ├── frontend/     # Angular 17+ UI (Tailwind CSS, RxJS)
│   └── server/       # NestJS API (Groq + Pinecone)
├── libs/
│   ├── api-interfaces/  # Shared TypeScript interfaces
│   └── ai-engine/      # LangChain RAG orchestration
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

Required:
- `GROQ_API_KEY` - [Groq Cloud](https://console.groq.com)
- `PINECONE_API_KEY` - [Pinecone](https://app.pinecone.io)
- `PINECONE_INDEX_NAME` - Your Pinecone index name (default: `smartdoc-index`)
- `HUGGINGFACE_API_KEY` - [Hugging Face](https://huggingface.co/settings/tokens) - Required for embeddings (chat + document ingestion)

### 3. Run

**API Server:**
```bash
npm run serve:server
```

**Frontend:**
```bash
npm run serve:frontend
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run serve:server` | Start NestJS API on port 3000 (validates .env first) |
| `npm run serve:frontend` | Start Angular app |
| `npm run build` | Build all apps and libs |
| `npm run lint` | Lint all projects |
| `nx run server:validate-env` | Validate that all required .env keys are set |
| `nx run server:test` | Run server unit and e2e tests (29 tests) |
| `nx run frontend:test` | Run frontend unit tests (components, services, pipes) |

## API Documentation

Interactive API documentation is available via Swagger/OpenAPI:

- **Local:** `http://localhost:3000/api/docs` (when server is running)
- **Features:**
  - Try out endpoints directly from the browser
  - View request/response schemas
  - See example requests and responses
  - All endpoints documented with descriptions and examples

## CI/CD

GitHub Actions runs on every push and pull request to `main`/`master`:

- **Tests**: Server unit + e2e + Frontend unit tests (mock API keys in CI)
- **Build**: All apps and libs

See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

**Health check:** `GET /health` (no `/api` prefix) returns `{ status, timestamp, checks }` for monitoring.

**API Documentation:** Swagger/OpenAPI docs available at `http://localhost:3000/api/docs` when the server is running.

## Architecture

- **Clean Architecture** & **SOLID** principles
- **api-interfaces**: Shared contracts between frontend and backend
- **ai-engine**: LangChain.js orchestration (Groq LLM, Pinecone vector store, Hugging Face embeddings)
- **ChatModule**: NestJS module that receives prompts, queries Pinecone, returns LLM responses. Includes conversation history in RAG prompt for contextual answers
- **Rate limiting**: 60 requests/minute per IP (configurable via `THROTTLE_TTL`, `THROTTLE_LIMIT`). `/health` excluded
- **Logging**: Pino structured JSON logs. Use `node dist/apps/server/main.js | npx pino-pretty` for readable dev output
- **DocumentsModule**: Upload PDF/TXT/MD files; parses, chunks, embeds, and upserts to Pinecone. Registry persisted to `data/documents.json`. `POST /api/documents/upload-stream` streams progress (parsing → chunking → indexing)
- **ConversationsModule**: Persists conversations to `data/conversations.json` (survives server restart)
- **ChatService** (frontend): RxJS-based reactive stream for chat messages
