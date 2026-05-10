# Bottlewise

The first AI Formula Helper for parents of formula-fed babies. Personalized formula guidance, transparent cost (including tariff/duty for imports), real-time stock signals, and an open-source feedback loop that gets smarter with every parent who uses it.

## Why this exists

The infant formula market is fragmented, anxiety-inducing, and increasingly unstable (2022 recall, ongoing tariff volatility on European brands, recurring local stock-outs). Parents do hours of research per decision and still feel uncertain. Pediatricians give limited brand-level guidance. There is no consumer-facing tool that combines ingredient transparency, cost reality (landed cost with duties), real-time availability, and personalized matching based on baby profile and family history.

Bottlewise is that tool. Open source from day one so the data flywheel — anonymized formula trial outcomes from real families — becomes a public good, not a proprietary moat owned by any single brand.

## What it does (V1)

- **Two entry flows**: "New to formula" (guided onboarding) and "On formula, need help" (troubleshooting).
- **Personalized recommendations**: 3 formulas matched to baby profile, family history, sensitivities, and budget — with reasons. Plus "avoid these because X" callouts.
- **Similarity engine**: "next closest option" when a recommended formula is unavailable or didn't work for your baby.
- **Cost transparency**: Per-ounce and per-serving cost, with landed cost (duty + estimated clearance delay) for imported brands.
- **Stock signals**: Probabilistic stock awareness — affiliate APIs for online retailers + crowdsourced local availability + DTC partnerships (phased).
- **Feedback loop**: Parents log trial outcomes; aggregate signal feeds the recommendation engine and the public dataset.
- **Formula maker settings**: Calibration library for Baby Brezza, Tommee Tippee Perfect Prep, etc., per formula.
- **Breast-to-formula bridge**: Transition mode with mixed-feeding guidance and gentle-introduction formula suggestions.

## What it explicitly is NOT (V1)

Read this before scoping.

- **Not medical advice.** Educational and decision-support only. Every recommendation surface includes "talk to your pediatrician" gating. We do not diagnose, we do not treat, we do not replace clinical care.
- **Not a marketplace.** No direct purchasing in V1. Affiliate links TBD (see Open Decisions).
- **Not a clinical tool.** No telehealth integration, no pediatrician-in-the-loop, no adverse event reporting in V1. These are Phase 2+.
- **Not genetic.** Genetics integration is Phase 3+. V1 uses self-reported family history only.
- **Not native iOS/Android first.** Web/PWA first via Expo Router web export, mobile builds shipped as wrappers when web product is validated.

## Stack

- **App**: Expo (React Native + Expo Router) — single codebase for web, iOS, Android
- **Backend**: Supabase (Postgres, Auth, Storage, Edge Functions, pgvector for similarity)
- **AI**: Anthropic Claude API — Sonnet for chat and reasoning, Haiku for cheap classification and similarity narration
- **Vector store**: pgvector inside Supabase (don't add another service)
- **Stock data**: Amazon Product Advertising API, Walmart Open API, crowdsource layer (own schema), DTC brand partnership APIs (phased)
- **Tariff data**: USITC HTS API + manually curated overlay for current Section 301/232 status
- **Hosting**: Vercel for web, EAS for mobile builds

## Repo structure

```
/
├── apps/
│   └── mobile/                # Expo app (web + iOS + Android)
├── packages/
│   ├── ai/                    # Claude prompts, RAG, similarity
│   ├── db/                    # Supabase migrations, types, seed
│   └── shared/                # Shared types, utils, constants
├── docs/
│   ├── PRD.md                 # Full product spec (start here)
│   ├── DATA_MODEL.md          # Schema reference
│   ├── AI_DESIGN.md           # AI architecture, prompts, similarity model
│   └── DATA_SOURCING.md       # Where formula data comes from; adapters, scrapers, merge rules
├── scripts/
│   ├── seed-formulas.ts       # Seed knowledge base (orchestrates Tier A–C adapters)
│   ├── refresh-tariffs.ts     # Pull latest HTS data
│   └── stock-poll.ts          # Affiliate API stock polling job
├── CLAUDE.md                  # Project-specific Claude Code instructions
└── README.md
```

## Quick start (target state)

```bash
pnpm install
cp .env.example .env  # fill in Supabase, Anthropic, Amazon PA-API, Walmart keys
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Open source posture

MIT license (TBD — see Open Decisions). The recommendation algorithm, the formula similarity model, the feedback schema, and the seed knowledge base are all open source. The aggregated anonymized trial outcome dataset is published as a versioned release artifact. Contributions welcome from parents, pediatricians, and developers.

## Compliance and safety

This product operates as **information & decision-support only** (Positioning Tier 1). All recommendation surfaces include explicit "not medical advice" framing and pediatrician-consult prompts. Adverse events and safety concerns are routed to "talk to your pediatrician" before any formula recommendation is shown. See `docs/PRD.md` § Compliance Framework.

## Where to start reading

1. `docs/PRD.md` — full product specification
2. `docs/DATA_MODEL.md` — database schema
3. `docs/AI_DESIGN.md` — AI architecture and prompt design
4. `docs/DATA_SOURCING.md` — where the formula knowledge base actually comes from
5. `CLAUDE.md` — operating instructions for Claude Code

## Status

Pre-implementation. Brief is final. Awaiting confirmation of Open Decisions before scaffolding begins.
