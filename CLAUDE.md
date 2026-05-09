# CLAUDE.md — Bottlewise Project Operating Instructions

This file layers on top of the global `~/.claude/CLAUDE.md`. The global rules (1-3-1, DRY, TDD, Continual Learning, Planning, LINT, CONTEXT, CONSISTENCY) apply unchanged. This file adds project-specific overrides and conventions.

---

## Project context (read first)

Read in this order before any non-trivial change:

1. `README.md` — project overview and stack
2. `docs/PRD.md` — product specification, scope, compliance framework
3. `docs/DATA_MODEL.md` — schema reference
4. `docs/AI_DESIGN.md` — AI architecture and prompts

For any change touching AI surfaces, prompts, or recommendation logic, `docs/AI_DESIGN.md` is mandatory pre-reading.

For any change touching the schema, `docs/DATA_MODEL.md` is mandatory pre-reading.

---

## Project-specific overrides

### Compliance is non-negotiable

This product handles infant nutrition decisions. Every feature must respect the Tier 1 positioning framework in `docs/PRD.md` § 2.

**Hard rules** (failing any of these is a release blocker, not a style issue):

- Never surface a formula not in the `formulas` table for the current retrieval context.
- Never let AI output bypass the safety pre-screen.
- Never remove or weaken "not medical advice" framing on any recommendation surface.
- Never let a safety trigger interstitial be dismissable in a way that immediately surfaces formula content. The user must explicitly continue and the next message must reclassify as non-emergency.
- Never log baby health data outside the user-scoped tables. Never include it in error messages, traces, or LLM prompts going to third parties (other than Anthropic, our AI provider, under Anthropic's terms).

If a planned implementation appears to conflict with any of these, STOP and surface a 1-3-1 to Jordan. Do not proceed.

### TDD scope

Global rule says TDD is critical for backend. For this project specifically:

- Backend (Supabase functions, AI logic, recommendation engine, scoring, safety triggers): **TDD required**. Confirm tests with Jordan before implementation.
- Frontend (Expo screens, navigation, UI components): **TDD optional** but encouraged for non-trivial state logic. Component snapshot tests are not required.
- AI prompts: **regression tests required**. Each prompt has a snapshot of expected behavior on a fixed set of inputs (`packages/ai/tests/snapshots/`). Prompt changes that alter the snapshot require justification in the PR.

### CONTEXT (codebase retrieval)

Before any change touching:
- The recommendation engine
- The safety layer
- The schema
- Any AI prompt
- The feedback loop schema

You must perform codebase retrieval and cite the specific files you reviewed in the plan. Insufficient retrieval on these areas is a stop-the-line condition.

### CONSISTENCY

- File naming: `kebab-case.ts` for source, `PascalCase.tsx` for React components, `kebab-case.test.ts` for tests.
- Folder structure follows the `apps/` and `packages/` layout in `README.md`. New code goes in an existing package unless creation of a new package is approved.
- Error handling: never throw raw strings. Use the typed error utilities in `packages/shared/src/errors.ts`.
- Database access: never raw SQL in app code. Always go through the typed Supabase client and the query helpers in `packages/db/src/queries/`.
- AI calls: never invoke the Anthropic SDK directly from app code. Always go through `packages/ai/src/client.ts` so model versioning, observability logging, and caps are uniformly applied.

### LINT

Project lint config in `eslint.config.js`. Project-specific additions:
- `no-restricted-imports` blocks direct Anthropic SDK imports outside `packages/ai`.
- `no-restricted-imports` blocks direct Supabase SDK imports outside `packages/db`.
- `no-restricted-syntax` blocks `console.log` in non-script files (use the logger in `packages/shared/src/log.ts`).

### DRY

Specifically watch for:
- Recommendation logic duplicated between Flow A and Flow B paths. The scoring algorithm is shared — only the inputs and output framing differ.
- Stock decay computation. There is one canonical implementation in `packages/db/src/stock.ts`. Don't reimplement in app code.
- Tariff/landed-cost math. One implementation in `packages/db/src/cost.ts`. Don't reimplement.

---

## Phased implementation guidance

The roadmap in `docs/PRD.md` § 7 defines the phases. Within each phase:

- Phase 0 work: schema, scaffold, seed. No AI yet. Proves the pipeline.
- Phase 1 work: core MVP. AI surfaces light up. Safety layer mandatory before any AI surface ships.
- Phase 2+ work: cost, stock, feedback. Each is a self-contained sprint.

Do not mix phases in the same PR. Do not start Phase 2 work until Phase 1 is shippable. Confirm with Jordan before starting a new phase.

---

## Open Decisions (require Jordan confirmation)

These are flagged across `PRD.md`, `DATA_MODEL.md`, and `AI_DESIGN.md`. Do not implement around them — surface them for resolution.

Highest-priority open decisions:
1. Affiliate revenue from V1 (yes/no)
2. License (MIT / Apache 2.0 / AGPL)
3. Embedding provider (Voyage / OpenAI / open-weights)
4. Stock data Phase 1 scope (Amazon only or Amazon + Walmart)
5. Pediatric advisory board (yes / no / Phase 2)

When you encounter one of these in the course of work, STOP and surface a 1-3-1 to Jordan. Do not pick a default and proceed.

---

## What "done" looks like for V1

- A new parent can sign up, complete intake for one baby, and receive 3 recommended formulas with reasons within 5 minutes.
- A parent on a formula that's out of stock can get a "next closest available" recommendation in under 30 seconds.
- A parent can log a trial outcome at 7 days and 30 days post-start.
- The aggregated public dataset has its first versioned release.
- Tariff impact is visible on every imported-formula card.
- The safety layer has been tested against a documented set of trigger inputs and refuses 100% of them.
- Lighthouse scores ≥90 on web. Cold start time on iOS ≤2.5s on a 2-year-old device.
- Zero P0 accessibility issues (per axe-core baseline).

---

## When stuck

Apply the 1-3-1 rule. State the problem clearly, propose three options with tradeoffs, recommend one, wait for Jordan's confirmation. Do not proceed implementing any of the options until confirmed.

For ambiguity that doesn't fit the 1-3-1 mold (e.g., "I'm not sure what you meant by X"), ask one focused clarifying question. Don't guess.

For conflicts between this file, the global CLAUDE.md, and any of the docs, **this file wins** for project-specific concerns, and the docs win for product/spec concerns. When in doubt, ask.
