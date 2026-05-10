# @bottlewise/narrator-worker

Cloudflare Worker that turns the deterministic ingredient-score breakdown into personalized narration via Claude. The Anthropic API key lives in Cloudflare secrets — it never enters the mobile bundle.

## What it does

```
apps/mobile  ──POST──►  this worker  ──POST──►  api.anthropic.com  ──►  Claude Haiku
     ▲                       │
     │     { sentences: [] } │  (Anthropic key in Cloudflare secrets)
     └───────────────────────┘
```

The mobile app calls this worker via `EXPO_PUBLIC_NARRATOR_URL`. When the worker returns sentences, the formula detail page renders them in the "A note for [baby]" surface with a sage **"Personalized"** chip. When the worker is unreachable or returns empty (e.g., misconfigured key), the client falls back to its templated narration with a neutral **"Templated"** chip.

The worker enforces — via the system prompt — that the model can only narrate over the breakdown it was given. It cannot invent concerns, cannot change the grade, cannot make medical claims. Output is strict JSON `{ sentences: string[] }`; the worker validates parses and falls back to `[]` if Claude breaks form.

## Deploy

You need a Cloudflare account (free tier is fine).

```bash
# Once globally
npm install -g wrangler

# In this package
cd packages/narrator-worker
npm install
wrangler login                # browser flow, one time

# Set the Anthropic key as a secret — NEVER commit it
wrangler secret put ANTHROPIC_API_KEY
# (paste your sk-ant-... key)

# Deploy
wrangler deploy
```

The deploy output gives you a URL like:

```
https://bottlewise-narrator.<your-account>.workers.dev
```

Wire that into the mobile app:

```bash
# apps/mobile/.env (create if absent)
EXPO_PUBLIC_NARRATOR_URL=https://bottlewise-narrator.<your-account>.workers.dev
```

Then rebuild the app:

```bash
cd apps/mobile
npm run web
```

Open `/formula/bobbie-original`. The "A note for Maya" block should render with a sage **Personalized** chip instead of the neutral **Templated** chip.

## Configure

`wrangler.toml` exposes three vars without code changes:

- `ANTHROPIC_MODEL` — defaults to `claude-haiku-4-5-20251001`. Switch to `claude-sonnet-4-6-...` if you want richer prose (with the latency / cost tradeoff).
- `ANTHROPIC_MAX_TOKENS` — defaults to 320 (intentionally short).
- `ALLOWED_ORIGINS` — comma-separated CORS allowlist. Defaults to `https://jordychase.github.io,http://localhost:8081`. Add domains as you ship to new origins.

`wrangler.toml` is in the repo; sensitive values are in `wrangler secret`.

## Local dev

```bash
wrangler dev
```

Serves on `http://localhost:8787`. To test against the local app, set:

```bash
EXPO_PUBLIC_NARRATOR_URL=http://localhost:8787 npm run web
```

Or curl directly:

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{
    "breakdown": {
      "grade": "C",
      "finalScore": 75,
      "concerns": [{
        "display": "Corn syrup solids",
        "severity": "moderate",
        "reason": "Some pediatric nutrition guidance prefers lactose as the primary carbohydrate when an infant tolerates it.",
        "source": "AAP committee on nutrition"
      }],
      "positives": [],
      "verdict": "Standard US formula panel — common ingredients with some tradeoffs."
    },
    "formula": {
      "id": "nutramigen",
      "brand": "Nutramigen",
      "name": "Nutramigen with Enflora LGG"
    },
    "profile": {
      "babyNameFirst": "Maya",
      "babyAgeMonths": 3,
      "familyEczema": true
    }
  }' | jq .
```

Expected response: `{ "sentences": ["...", "...", "...", "Talk to your pediatrician before changing formulas."] }`.

## Observability

`wrangler.toml` has `observability.enabled = true`. Logs (including any Anthropic failures) appear in the Cloudflare dashboard under **Workers & Pages → bottlewise-narrator → Logs**. The worker logs but does not throw — failed Claude calls return `{ sentences: [] }` with a 200, so the UI degrades gracefully.

## Cost expectation

At a fixed 320-max-tokens cap with Claude Haiku, each narration is ~$0.0004. 100k narrations ≈ $40. The free Cloudflare tier covers 100k Worker requests/day; only the Anthropic spend grows with usage.

## What is NOT in this worker

- No auth. Anyone with the URL can call it. We rely on:
  1. CORS to limit browser-origin abuse to known sites.
  2. Cloudflare's built-in rate limiting (configure in dashboard if abuse surfaces).
  3. The narrow prompt — abusing this endpoint to get free Claude responses for unrelated tasks is hard because the system prompt clamps the output.
  If you outgrow these guards, add a signed-request layer keyed off your Supabase auth session.
- No baby-profile persistence. Each call is stateless. The mobile app passes profile context per-call.
- No caching. Each request hits Anthropic. If repeat-call costs become meaningful, add a Cloudflare KV cache keyed on `(formulaId, profileHash)`.
