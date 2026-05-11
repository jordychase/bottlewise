# Handoff

**As of:** 2026-05-11 · commit [b3be41a](https://github.com/jordychase/bottlewise/commit/b3be41a)
**Live demo:** https://jordychase.github.io/bottlewise/app/
**Public landing (design system + links):** https://jordychase.github.io/bottlewise/

This doc tells a new Claude Code session — or a human picking up cold — exactly where the project stands, what's working, what's blocked on an operator, and what the smartest next pickup is. Read this first; the deeper docs are linked in context.

---

## What's working end-to-end

The demo loop is real: Welcome → Recommendation → Detail → Substitution → Restock → Switch-back. Every screen renders against a real algorithm or real data — no Lorem Ipsum.

| Surface | Status | Source |
|---|---|---|
| Welcome (first-time + returning + watching states) | ✅ Live | [`apps/mobile/app/index.tsx`](../apps/mobile/app/index.tsx) |
| Intake (prep method + issues) | ✅ Live | [`apps/mobile/app/intake.tsx`](../apps/mobile/app/intake.tsx) |
| Troubleshoot — formula lookup (60 indexed) | ✅ Live | [`apps/mobile/app/troubleshoot.tsx`](../apps/mobile/app/troubleshoot.tsx) |
| Recommendations — engine-driven 3 picks + avoid list | ✅ Live | [`lib/recommendation.ts`](../apps/mobile/src/lib/recommendation.ts) |
| Formula detail (narration · score · calibration · quantity · community · share) | ✅ Live | [`app/formula/[id]/index.tsx`](../apps/mobile/app/formula/%5Bid%5D/index.tsx) |
| Substitution flow with reason tabs + similarity engine | ✅ Live | [`lib/similarity.ts`](../apps/mobile/src/lib/similarity.ts) |
| Safety / recall interstitial | ✅ Live | [`app/safety/recall.tsx`](../apps/mobile/app/safety/recall.tsx) |
| Current-formula tracking + restock-monitor banner | ✅ Live | [`state/baby-profile.tsx`](../apps/mobile/src/state/baby-profile.tsx) + [`state/stock.tsx`](../apps/mobile/src/state/stock.tsx) |
| Ingredient review (deterministic A–F + cited concerns) | ✅ Live | [`lib/ingredient-score.ts`](../apps/mobile/src/lib/ingredient-score.ts) |
| Personalized narration (templated layer) | ✅ Live | [`lib/narrator.ts`](../apps/mobile/src/lib/narrator.ts) |
| Personalized narration (Claude layer) | 🟡 Built, not deployed | [`packages/narrator-worker/`](../packages/narrator-worker/) — needs `wrangler deploy` |
| Supabase schema (13 migrations) | ✅ Validated against pg15 | [`supabase/migrations/`](../supabase/migrations/) |
| @bottlewise/db adapter framework | ✅ Live · 47 brand registry · 12/47 validated | [`packages/db/`](../packages/db/) |
| FDA submissions + openFDA recalls adapters | ✅ Implemented · run via `pnpm fda` | [`packages/db/src/sources/adapters/`](../packages/db/src/sources/adapters/) |
| Tier D retailer adapters (Amazon · Walmart · Target) | 🟡 Scaffolded, awaiting credentials | same dir |
| Merge layer (source_records → canonical formulas) | ✅ Built, needs Supabase env to run | [`lib/merge.ts`](../packages/db/src/sources/merge.ts) |
| GitHub Actions deploy on push | ✅ Live | [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml) |
| Test suite | ✅ 76/76 passing across 3 packages | mobile 37 · db 35 · worker 4 |

## What's blocked on an operator (NOT a build problem)

These are real-world signups and deploys that can't be automated:

1. **Amazon Associates → PA-API approval.** See [`docs/CREDENTIALS_SETUP.md`](CREDENTIALS_SETUP.md) § 3. Run `pnpm signup` to get the guided flow.
2. **Walmart Affiliate API.** Same runbook § 2. Keypair generator at [`scripts/gen-walmart-key.sh`](../scripts/gen-walmart-key.sh).
3. **Anthropic API key + narrator worker deploy.** Three commands once the key is in hand — `wrangler login && wrangler secret put ANTHROPIC_API_KEY && wrangler deploy`. Flips the "Templated" chip to "Personalized" automatically. See [`packages/narrator-worker/README.md`](../packages/narrator-worker/README.md).
4. **Send the Perrigo email.** Draft ready in [`docs/PERRIGO_OUTREACH.md`](PERRIGO_OUTREACH.md). One Perrigo deal unblocks live data for 10 store-brand SKUs (Parent's Choice, Up & Up, Kirkland, Mama Bear, Berkley Jensen, Tippy Toes, CVS, HEB, Comforts, Member's Mark).
5. **URL fixes for the 13 stale-URL brands** in [`docs/VALIDATION_LOG.md`](VALIDATION_LOG.md). ~5 min per brand of browser-based discovery.

The status of each is tracked in `~/.bottlewise-signup.local.json` via the signup copilot.

## Where to start reading (Claude Code or human)

In order of value-per-minute:

1. **This doc** — current state map.
2. **[`README.md`](../README.md)** — project overview + quick start commands.
3. **[`CLAUDE.md`](../CLAUDE.md)** — non-negotiable operating rules. Compliance is load-bearing.
4. **[`docs/PRD.md`](PRD.md)** — full V1 spec. Read § 2 (Tier 1 positioning) and § 6 (out-of-stock cascade) at minimum.
5. **[`docs/DATA_SOURCING.md`](DATA_SOURCING.md)** § 10 — implementation order with ✅ / 🟡 status flags.
6. **[`docs/VALIDATION_LOG.md`](VALIDATION_LOG.md)** — what's been probed, what passes, what's stale.

For specific tasks:

- Adapter / scraper work → [`packages/db/README.md`](../packages/db/README.md)
- Mobile app feature work → [`apps/mobile/README.md`](../apps/mobile/README.md)
- Schema changes → [`docs/DATA_MODEL.md`](DATA_MODEL.md) + [`supabase/README.md`](../supabase/README.md)
- Design / tokens → [`packages/design-system/README.md`](../packages/design-system/README.md) + [`packages/design-system/BRAND_RATIONALE.md`](../packages/design-system/BRAND_RATIONALE.md)
- AI work → [`docs/AI_DESIGN.md`](AI_DESIGN.md) + [`packages/narrator-worker/README.md`](../packages/narrator-worker/README.md)

## Quick start

```bash
git clone https://github.com/jordychase/bottlewise.git
cd bottlewise

# Workspace + adapter packages (pnpm)
pnpm install

# Mobile app uses npm in its own subdir — see "Known gotchas" below
cd apps/mobile && npm install && cd ../..

# Run the mobile app on web
pnpm --filter @bottlewise/mobile run web    # http://localhost:8081

# Inspect the brand registry
pnpm seed:list

# Probe registry entries against their live sources
pnpm seed:validate

# FDA gate + recalls
pnpm fda

# Guided account creation for Amazon / Walmart / Anthropic
pnpm signup

# Run every test suite
pnpm --filter @bottlewise/db run test
cd apps/mobile && npx vitest run && cd ../..
cd packages/narrator-worker && npx vitest run && cd ../..
```

## Known gotchas

**pnpm + npm split.** `apps/mobile` is intentionally excluded from the pnpm workspace and uses npm directly. Expo's Metro bundler fights pnpm's nested `node_modules` layout; specifically `@babel/runtime` and `expo-modules-core` won't resolve through pnpm hoisting. `packages/*` stays on pnpm. See [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) for the recorded reasoning. **Don't run `pnpm install` from inside `apps/mobile`.**

**Demo profile bleeds defaults.** `BabyProfileProvider.loadFromStorage` does `{ ...DEFAULT_PROFILE, ...parsed }`, so a saved profile that omits a field inherits the demo defaults (Maya, 3 mo, eczema, on Bobbie). Intentional — the demo surfaces work out of the box. To test a truly fresh state, write `currentFormulaId: null` explicitly. Reset everything with `localStorage.clear()` then `localStorage.setItem(...)` if you need a non-default starting profile.

**RN Pressable + synthetic events.** React Native Web's Pressable doesn't fire on `element.dispatchEvent(new MouseEvent('click'))`. Modal interactions (substitute confirm, experience submit) can be tested visually but not driven via `eval` from Claude Code Preview tools. Use the unit tests for click-handler logic.

**Workspace tsc has noise.** Running `npx tsc --noEmit` from the workspace root may pick up vitest configs with `import.meta` etc. Run typecheck from each package directory instead — every package has its own `tsconfig.json` and clean check.

**Calibration entries are hand-curated.** Only 10 formula × dispenser combinations have settings today ([`apps/mobile/src/data/calibration.ts`](../apps/mobile/src/data/calibration.ts)). Adding more is mechanical — the engineering is done.

**Validation flag.** Every brand-registry entry ships with `validated: false`. Flipping to `true` is an operator action after a smoke pass. See [`docs/VALIDATION_LOG.md`](VALIDATION_LOG.md) § "2026-05-09 — Initial sweep" for the existing record.

## Suggested first pickup

In order of impact-per-hour:

1. **Run `pnpm signup` and clear the queue.** ~30 minutes of guided clicking → 1–7 days of waiting → live retailer data for 10 brands. The runbook is in `docs/CREDENTIALS_SETUP.md` and the copilot generates all the application copy. Highest-leverage move you can make today.

2. **Deploy the narrator worker.** Three commands once an Anthropic API key is in hand. The "A note for [baby]" chip flips from "Templated" to "Personalized" on the live site. Cost: ~$0.0004 per narration with Haiku.

3. **Send the Perrigo email.** Drafted in `docs/PERRIGO_OUTREACH.md`. Five minutes to send. One Perrigo agreement covers Parent's Choice / Up & Up / Kirkland / Mama Bear / Berkley Jensen / Tippy Toes / CVS / HEB / Comforts / Member's Mark in one stroke — the WIC-eligible audience this product is built for.

4. **URL fixes from the validation log.** 13 brands at ~5 min each. Pattern: open the brand's site, find the current products listing URL, update `packages/db/src/sources/registry.ts`, set `validated: true`. The sub-brand consolidation pattern (Nutramigen routed through enfamil.com/products/) is documented in commit [afc51fa](https://github.com/jordychase/bottlewise/commit/afc51fa) for reference.

5. **Hook real Supabase auth + persistence.** `formula_trials` + `trial_outcomes` tables already exist. Wiring auth replaces the localStorage layer in `src/state/baby-profile.tsx` and `src/lib/community.ts` without touching consumers.

The product loop (Welcome → Recommendation → Detail → Substitution → Restock) is functionally complete. Everything above is operational depth, not new feature work.

## Open decisions (PRD § 9) still requiring Jordan's input

These are blockers for downstream work and are deliberately not picked by Claude or by the codebase:

1. **Affiliate revenue from V1.** Affects schema (whether `affiliate_link` table ships in V1 migrations), disclosure copy, FTC compliance work.
2. **License: MIT / Apache 2.0 / AGPL.** AGPL protects the data flywheel; MIT maximizes adoption.
3. **Stack confirmation.** Brief assumed Expo + Supabase. Both are now wired; confirming this as the long-term stack lets us optimize.
4. **Stock data Phase 1 scope.** Amazon only or Amazon + Walmart simultaneously.
5. **Crowdsource trust model.** Reputation system (per `DATA_MODEL.md`) vs simpler "all reports equal, decayed by time" for V1.
6. **Public dataset release cadence.** Monthly versioned release / live API / on-demand.
7. **Beta tester recruitment channel.** Veridian audience / r/FormulaFeeders / pediatric practices.
8. **Branding / copy tone.** Already opinionated in the design system; calling this confirmed unblocks future copy work.
9. **Pediatric advisory board.** Significantly strengthens the legal posture even at Tier 1 positioning.

## Test invariants worth knowing

The unit tests aren't just for green CI — they encode the load-bearing product claims:

- **`Parent's Choice Tender is the top match for Nutramigen recall, score ≥ 95`** ([`recommendation.test.ts`](../apps/mobile/src/lib/__tests__/recommendation.test.ts)). This is the killer-feature assertion. If it ever breaks, the demo's headline story stops working.
- **`Recalled formulas excluded from substitution`** ([`similarity.test.ts`](../apps/mobile/src/lib/__tests__/similarity.test.ts)). Compliance-critical.
- **`too_expensive prefers cheaper segments but NEVER trades protein source for cost`** (similarity.test.ts). The product's promise is "WIC-budget alternatives when clinically appropriate" — this guards the second half.
- **`Family CMPA returns hypoallergenic top pick`** (recommendation.test.ts). Same compliance-critical class.

Don't regress these without surfacing the change.

## Contact

- Public site: https://jordychase.github.io/bottlewise/app/
- Repo: https://github.com/jordychase/bottlewise
- Validation log: [`docs/VALIDATION_LOG.md`](VALIDATION_LOG.md) — append to it whenever you flip `validated: true` for a brand.
