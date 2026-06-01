# Managed AI models

The default agent uses **Google Gemini Flash** for conversational turns. An optional **OpenAI GPT-4o mini** path handles structured lesson-progress grading when `OPENAI_API_KEY` is set.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | Yes (managed chat) | API key from [Google AI Studio](https://aistudio.google.com/apikey) or Vertex AI |
| `GEMINI_MODEL` | No | Default: `gemini-2.0-flash` |
| `OPENAI_API_KEY` | No | Enables JSON lesson-progress grading via GPT-4o mini |
| `OPENAI_MODEL` | No | Default: `gpt-4o-mini` |
| `PORT` | No | Default: `3000` |
| `CHAT_PROVIDER` | No | `auto` (default), `gemini`, or `openai`. Use `openai` if Gemini free tier quota is exhausted |
| `PROGRESS_GRADE_EVERY_N` | No | Run progress grading every N user turns in teach/correct modes (default: `3`) |

Copy `.env.example` to `.env` and set at least `GOOGLE_API_KEY`.

## Model IDs

| Role | Provider | Model ID | When used |
|------|----------|----------|-----------|
| Default chat | Google | `gemini-2.0-flash` | All modes for assistant replies |
| Lesson progress JSON | OpenAI | `gpt-4o-mini` | Every N turns in `teach` / `correct` when `OPENAI_API_KEY` is set |

### Vertex AI

To use Vertex instead of AI Studio, set `GOOGLE_API_KEY` to a valid access token or use a service account flow in your deployment. Update `GEMINI_API_BASE` in `server/config.js` if you host on a custom endpoint.

## Routing

- `CHAT_PROVIDER=auto` → Gemini Flash first; on 429/quota errors, falls back to GPT-4o mini if `OPENAI_API_KEY` is set
- `CHAT_PROVIDER=openai` → GPT-4o mini for all chat (use when Gemini billing/quota is unavailable)
- `CHAT_PROVIDER=gemini` → Gemini only (no fallback)
- `teach` / `correct` + `OPENAI_API_KEY` → periodic GPT-4o mini call for `progress` JSON only

Flagship upgrades (Gemini Pro, Claude Sonnet) are not wired in v1; extend `server/providers/index.js` when needed.
