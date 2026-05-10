# Bottlewise — Data Sourcing

**Companion to**: `PRD.md`, `DATA_MODEL.md`, `AI_DESIGN.md`
**Implementation target**: per-source adapters in `packages/db/src/sources/`, scheduled runs via Supabase cron + Edge Functions

This document specifies where the formula knowledge base actually comes from. The seed KB is the foundation everything else sits on — recommendations, similarity, cost transparency, stock signals, and the public dataset all consume it. If sourcing is wrong, every downstream surface is wrong.

The brief specifies sources for **stock** (Amazon PA-API, Walmart, crowdsource, DTC) and **tariffs** (USITC HTS API + manual overlay) but is silent on where formula composition data itself comes from. This doc closes that gap.

---

## 1. Principles

1. **Provenance per field.** Every attribute on a formula carries source + last-verified timestamp. "Where does this come from?" must be answerable from the database alone, no archaeology required.
2. **FDA registration is the gate.** Only formulas with `fda_status` in `('registered', 'enforcement_discretion')` are eligible to surface to users. `gray_market` and `unknown` are stored but hidden by default and never recommended.
3. **Authoritative beats community beats inferred.** When sources conflict, precedence is fixed (see § 4). No silent merging.
4. **APIs over scrapers when both exist.** Scrapers are a permanent maintenance cost — accept it, but don't volunteer for it when an API is available.
5. **Polite scraping or no scraping.** Robots.txt-respecting, rate-limited, identifying user-agent, attribution honored. A brand that asks us to stop gets stopped same-day.
6. **Adapters are idempotent.** A run produces a deterministic set of upserts against the merge layer. Re-running an adapter without source changes produces zero diffs.
7. **Adapter failures are visible.** A scraper that silently stops returning data is worse than one that loudly breaks. All adapters report success/failure counts and field coverage every run.

---

## 2. Sources by tier

### Tier A — Authoritative (gate, recall, regulatory)

| Source | Provides | Mechanism | Cadence |
|---|---|---|---|
| FDA Infant Formula Submissions list | `fda_status='registered'`, manufacturer registration, product names | HTML scrape of `fda.gov/food/infant-formula-guidance-documents-regulatory-information/submission-infant-formulas-fda` | Weekly |
| openFDA `food/enforcement.json` | Recall events (classification, reason, status, recall date) | Public REST API, no key required | Hourly |
| USITC HTS API | Base duty rates by HTS code | Public REST API | Weekly |
| FDA recall RSS | Real-time recall alerting | RSS poll | Every 15 min |

**Notes:**
- The FDA submissions list is not a clean API. Plan for HTML-parser fragility; cache the raw HTML on every fetch so we can diff structurally and detect format changes before they break the parser.
- openFDA recall classifications: Class I (serious health risk) auto-fires the safety interstitial pipeline, Class II/III flag the formula in `formulas.recalled_at` but don't pre-empt the AI flow. See § 6 for the recall handling contract.

### Tier B — Open community (broad coverage, variable quality)

| Source | Provides | Mechanism | Cadence |
|---|---|---|---|
| OpenFoodFacts | Ingredients, allergens, nutrition, photos | Public API, optional auth for higher rate limits | Monthly bulk |
| USDA FoodData Central | Nutrition facts (well-structured), some ingredients | API key (free), REST | Monthly |
| GS1 / UPC Item DB | UPC ↔ product matching across retailers | Paid tier likely required | On-demand at price-poll time |

**Notes:**
- OpenFoodFacts US coverage is thinner than EU; expect ~60-70% hit rate for US-marketed formulas, ~85% for European-import brands we care about.
- USDA FDC has stable nutrition data but inconsistent per-100g vs per-serving normalization. Adapter must reconcile to per-100kcal (Bottlewise canonical unit).

### Tier C — Brand DTC (the meat of the seed KB)

The brand registry must reflect every infant formula a US family might encounter, across every budget and life circumstance. Premium DTC alone leaves out the WIC parent buying Parent's Choice, the immigrant family buying Dutch HiPP through a specialty importer, the NICU graduate on NeoSure, the EoE infant on EleCare. Comprehensive coverage is non-negotiable.

**~47 brands shipped in `packages/db/src/sources/registry.ts`**, grouped by segment:

| Segment | Brands |
|---|---|
| Mass-market US | Enfamil, Similac, Gerber Good Start, Earth's Best Organic |
| Private label / WIC-budget | Parent's Choice (Walmart), Up & Up (Target), Comforts (Kroger), Member's Mark (Sam's), Kirkland Signature (Costco), Mama Bear (Amazon), Berkley Jensen (BJ's), Tippy Toes (Aldi), CVS Health, HEB Baby |
| Premium US DTC | Bobbie, ByHeart, Serenity Kids, Else Nutrition, Earthly Origins, Happy Baby Organic, Munchkin Grass Fed, Burt's Bees Baby Organic |
| European import | HiPP (DE / UK / NL / US-importer), Holle, Lebenswert, Loulouka, Kendamil, Aussie Bubs, Bubs Australia, Töpfer Lactana, Nannycare, Holle Goat, Kendamil Goat, a2 Platinum |
| Hypoallergenic (extensively hydrolyzed) | Nutramigen, Similac Alimentum, Gerber Extensive HA, Pregestimil |
| Amino-acid elemental | EleCare, Neocate, PurAmino |
| Preemie post-discharge | Similac NeoSure, Enfamil EnfaCare |
| Goat milk specialist | Kabrita |
| A2 milk | a2 Platinum (cross-segment) |
| Plant-based | Else Nutrition (cross-segment) |

**Engine assignment.** Each registry entry routes to one of three DTC engines or one of two non-DTC dispatchers:

| Engine | Count | When it works | Coverage |
|---|---|---|---|
| `shopify` | ~11 | Storefront exposes `/products.json` | Most modern DTC (Bobbie, Serenity Kids, Else, Earthly Origins, Kabrita, Aussie Bubs, ...) |
| `jsonld` | ~12 | Site embeds schema.org Product markup | Many corporate sites; some modern DTC |
| `html` | ~14 | Per-brand selectors required | Legacy big-brand sites (Enfamil, Similac, regional HiPP, specialty Abbott / Mead Johnson sub-brands) |
| `retailer_api` | ~10 | Brand has no DTC site | Private-label brands sourced via Amazon PA-API / Walmart / Target |
| `manual_only` | 0 | NICU / prescription with no public surface | Reserved for hospital-only formulas |

**Validation discipline.** Every registry entry ships with `validated: false`. That flag means "engine + config are an informed guess; an operator must run a smoke test before relying on the data." A real validation pass: run `pnpm seed --brand=<id> --out=./staging`, inspect the JSON, fix selectors or swap the engine if the catalog looks wrong, flip the flag.

**Adding a brand** = appending to `BRAND_REGISTRY` in `registry.ts`. Most additions are 10 lines of config; only legacy custom-CMS sites need bespoke selectors.

### Tier D — Retailer (price + stock, NOT composition)

Already specified in PRD. Mentioned here for completeness:

| Source | Provides | Cadence |
|---|---|---|
| Amazon PA-API | Price, availability, sometimes nutrition panel via product detail | Stock: 4h. Price: daily. |
| Walmart Open API | Price, availability | Stock: 4h. Price: daily. |
| Target RedSky | Price, availability | Stock: 4h. Price: daily. |
| DTC partner APIs (Bobbie, ByHeart) | Authoritative price + stock for that brand | Real-time webhook where available |
| Crowdsource (own schema) | Local store stock signals | Continuous |

**Do not** use retailer APIs as a source for ingredient/composition data. The product descriptions vary wildly per ASIN and aren't authoritative.

### Tier E — Manual overlay (curator-driven)

Human-maintained data that has no upstream source:

| Field | Why curated | Where it lives |
|---|---|---|
| FDA enforcement-discretion status per European brand | Status is FDA-discretionary, changes over time, not API-published | `tariff_data` analog table or `formulas.fda_status` writes by curator |
| Section 301 / 232 tariff overlays | Policy-level; USITC API doesn't reflect ad-hoc trade actions | `tariff_data.section_301_pct`, `section_232_pct` |
| HTS code per formula | Inferred-then-verified; ambiguous for novel product types | `formulas.hts_code` |
| Brand opt-out status | Tracks brand requests to be removed from auto-scraping | `brands.scrape_status` (proposed — see § 8) |

Curator workflow: GitHub PR → CSV → migration. Every manual write logged in `source_runs` with `adapter_id='manual'` and PR link.

---

## 3. Adapter pattern

Every source implements the same TypeScript interface, lives in `packages/db/src/sources/{source-id}/`, and exports its config + a single `run()` entrypoint.

```ts
type SourceTier = 'authoritative' | 'community' | 'brand_dtc' | 'retailer' | 'manual';

type FieldKey = keyof FormulaRecord | 'recall' | 'price' | 'stock';

interface FormulaSourceAdapter {
  readonly id: string;                  // 'fda' | 'openfda' | 'off' | 'usda' | 'brand:bobbie' | ...
  readonly tier: SourceTier;
  readonly provides: FieldKey[];        // which fields this source authoritatively contributes
  readonly cadence: string;             // human-readable; the cron is in scheduling config

  run(opts: RunOpts): Promise<RunResult>;
}

interface RunOpts {
  since?: Date;                         // incremental fetch hint; adapter may ignore
  dryRun?: boolean;                     // log diffs without writing
  limit?: number;                       // for backfill chunking
}

interface RunResult {
  records_seen: number;
  records_upserted: number;
  records_unchanged: number;
  errors: AdapterError[];
  field_coverage: Record<FieldKey, number>; // 0..1 per field this run produced
  raw_artifacts_path?: string;          // S3/Storage key for raw HTML/JSON snapshot
}
```

Adapters never write directly to `formulas`. They write to a per-source staging table (`source_records`) keyed by `(adapter_id, external_id)`. The merge layer (§ 4) reads staging and produces canonical writes to `formulas` and friends.

---

## 4. Merge & precedence

Per-field precedence ordering when multiple sources observe the same formula. Resolved at merge time (a separate scheduled job), not at adapter-write time.

| Field | Precedence (highest → lowest) |
|---|---|
| `fda_status` | FDA submissions list → manual overlay → `'unknown'` |
| `recalled_at` | openFDA enforcement events ONLY |
| `brand_id`, `manufacturer_id` | FDA list → brand DTC → manual |
| `country_of_origin` | brand DTC → FDA list → OpenFoodFacts → manual |
| `protein_source`, `protein_form` | brand DTC → OpenFoodFacts → USDA |
| `carb_source` | brand DTC → OpenFoodFacts |
| `fat_blend` (DHA/ARA/MFGM/palm) | brand DTC → USDA → OpenFoodFacts |
| `formula_ingredients` (full list) | brand DTC → OpenFoodFacts → USDA |
| `specialty_designations` | brand DTC → certification body (USDA Organic, EU Organic) → OpenFoodFacts |
| `pediatric_indications` | brand DTC ONLY (clinical claims should not be inferred) |
| `formula_certifications.verified` | direct certification body → brand DTC self-claim → unverified |
| `hts_code` | manual overlay → inferred default by `country_of_origin + protein_source` |
| `prices` | append-only per source — no merge |
| `stock_signals` | append-only per source — no merge |

**Conflict logging.** Whenever the merge layer would overwrite an existing canonical value with a higher-precedence source, log to `source_conflicts` with old/new/source. Never silently overwrite without an audit trail.

**Provenance.** Each canonical row carries a `provenance jsonb` column mapping field → `{ source_id, observed_at }`. Or, alternatively, a separate `field_provenance` table keyed by `(table, row_id, field)`. See § 8 Open Decisions.

---

## 5. Schedules

Run via Supabase cron + Edge Functions. Cron expressions live in `supabase/functions/{adapter}/schedule.json`. Adapters that exceed Edge Function time limits run as long-poll workers via a separate runner (decision deferred until we hit the limit).

| Adapter | Cron | Notes |
|---|---|---|
| `openfda-recalls` | `*/15 * * * *` | Safety-critical |
| `amazon-pa-api-stock` | `0 */4 * * *` | Rate-limit-bound |
| `walmart-stock` | `0 */4 * * *` | |
| `target-redsky-stock` | `0 */4 * * *` | |
| `amazon-pa-api-price` | `0 6 * * *` | Daily |
| `walmart-price` | `0 6 * * *` | Daily |
| `fda-submissions` | `0 9 * * MON` | Weekly Monday morning |
| `brand:*` | `0 10 * * MON` | Weekly Monday; staggered per brand |
| `usitc-hts` | `0 11 * * MON` | Weekly |
| `openfoodfacts-bulk` | `0 4 1 * *` | Monthly first-of-month |
| `usda-fdc` | `0 5 1 * *` | Monthly first-of-month |
| `merge-canonical` | `0 * * * *` | Hourly merge sweep |

---

## 6. Recall handling contract

Recalls are the highest-stakes data flow in the product. The full pipeline:

1. `openfda-recalls` runs every 15 min, polls `food/enforcement.json` filtered to product description containing infant formula keywords.
2. New recall event → matched to `formulas` by brand + product name fuzzy match (Levenshtein < 3 + brand exact match). Unmatched events go to a curator review queue.
3. On match: `formulas.recalled_at` is set, `formula_recalls` row inserted (proposed table, see § 8), and a Supabase realtime broadcast fires.
4. Class I recalls: every active `formula_trials` row pointing at this formula triggers a push notification to the parent (separate from recommendation flow). UI is "your baby's formula has been recalled — here is the FDA notice — talk to your pediatrician — here are alternatives."
5. The recommendation engine immediately downranks recalled formulas to score 0 regardless of other attributes. They cannot surface as a recommendation while `recalled_at` is set and `recall_status != 'resolved'`.
6. Substitution flow (`out_of_stock_cascade`) treats recall as a stronger trigger than out-of-stock — automatic top-3 alternates surfaced.

---

## 7. Scraping policy

Public commitments (publish in `SCRAPING_POLICY.md` once V1 ships):

- **User-agent**: `Bottlewise/{version} (+https://github.com/jordychase/bottlewise; data@bottlewise.app)` — identifying, contactable, version-stamped.
- **Rate**: minimum 5s between requests per origin; 30s minimum for FDA (their HTML is large).
- **Robots.txt**: respected. If a brand's robots.txt disallows, we do not scrape that brand and instead pursue partnership.
- **Caching**: every HTML fetch cached for the full cadence period; no refetch within window.
- **Backoff**: exponential on 4xx/5xx, capped at 24h. Pause > 7 days alerts the curator and opens a GitHub issue.
- **Opt-out**: a brand emailing `data@bottlewise.app` requesting removal triggers same-day move to `scrape_status='opted_out'`. Existing data is retained but staled (no further updates) and labeled "last verified YYYY-MM-DD; brand has opted out of automated updates."
- **No JS execution by default.** Use raw HTML. Playwright/headless only for confirmed JS-only product pages, with explicit per-brand config flag.
- **Attribution.** Every formula detail page in the app shows the data source(s) for that record.

---

## 8. Schema additions required

Flagged here, to be reflected in `DATA_MODEL.md` once approved:

### Proposed: `formula_recalls`
- `id uuid pk`
- `formula_id uuid fk → formulas(id)`
- `openfda_recall_id text` — provenance back to enforcement record
- `classification text` — `'Class I' | 'Class II' | 'Class III'`
- `reason text`
- `recall_status text` — `'ongoing' | 'completed' | 'terminated'`
- `recall_initiation_date date`
- `terminated_date date`
- `notes text`
- `created_at`, `updated_at`

### Proposed: `formulas.recalled_at timestamptz` (denormalized for fast filtering)

### Proposed: `source_records` (staging for adapter writes)
- `id uuid pk`
- `adapter_id text not null`
- `external_id text not null` — adapter's stable ID (UPC, FDA submission ID, brand SKU)
- `payload jsonb not null` — normalized record from adapter
- `observed_at timestamptz not null default now()`
- `raw_artifact_path text` — pointer to raw HTML/JSON in Storage
- Unique on `(adapter_id, external_id, observed_at)`

### Proposed: `source_runs` (telemetry)
- `id uuid pk`
- `adapter_id text not null`
- `started_at timestamptz`, `ended_at timestamptz`
- `status text` — `'success' | 'partial' | 'failed'`
- `records_seen integer`, `records_upserted integer`
- `field_coverage jsonb`
- `errors jsonb`

### Proposed: `source_conflicts` (audit trail for merge overrides)
- `id uuid pk`
- `formula_id uuid fk → formulas(id)`
- `field text not null`
- `old_value jsonb`, `new_value jsonb`
- `old_source text`, `new_source text`
- `resolved_at timestamptz default now()`

### Proposed: `brands.scrape_status text`
- Enum: `'auto' | 'partnership_only' | 'opted_out'`
- Default `'auto'`

### Proposed: `formulas.provenance jsonb` (or separate `field_provenance` table)
See § 9 Open Decisions item 1.

---

## 9. Open decisions (require Jordan confirmation before implementation)

1. **Provenance granularity.** Per-field provenance JSONB on `formulas` (simpler, denormalized, cheaper at scale) vs separate `field_provenance` table (queryable, normalized, joins required for display). Recommend JSONB for V1.
2. **Recall history retention.** Keep all historical `formula_recalls` rows forever, or prune resolved-and-terminated rows after 5y? Compliance posture probably says forever.
3. **Brand-DTC partnership posture.** Scrape politely until told to stop (current proposal), or proactively email every brand on the allowlist before first scrape? Slower start, better optics, harder to scale.
4. **Crowdsource extension to formula attributes.** PRD currently scopes crowdsource to stock signals only. Should parents be able to submit ingredient corrections (e.g., "this formula reformulated last month, here's a photo of the new label")? Adds a moderation surface but closes a real gap.
5. **Initial brand allowlist size.** Start with the ~16 listed in § 2 Tier C, or broader (~30+) for fuller EU coverage on day one? Affects scraper-build effort.
6. **Public dataset release contents.** Does the open-data release include source-attributed records (full provenance), or only the merged canonical set? Provenance-included is more useful but also more identifying re: which brands we scrape and at what cadence.
7. **Retailer API legal review.** Amazon PA-API and Walmart Open API are official; Target RedSky is unofficial-but-stable. Keep RedSky as a Tier D source, or drop it for risk reduction?
8. **Field-level confidence scores.** Should the merge layer compute and store a confidence score per field (e.g., based on source tier + corroboration)? Useful for AI prompt context but adds compute.

---

## 10. Implementation order

Suggested sequencing for the seed KB build, top-down dependencies. ✅ = shipped, 🟡 = scaffolded but needs validation/credentials.

1. ✅ Brand registry + three generic engines (`shopify`, `jsonld`, `html`) + polite HTTP client + runner CLI. See `packages/db/`.
2. ✅ `fda-submissions` adapter — the gate. Without this no formula is allowed to surface to users regardless of how rich its DTC scrape is. (`packages/db/src/sources/adapters/fda-submissions.ts`, `pnpm fda --submissions-only`)
3. ✅ `openfda-recalls` adapter — safety-critical, runs against gated formulas every 15 min. (`packages/db/src/sources/adapters/openfda-recalls.ts`, `pnpm fda --recalls-only`)
4. 🟡 Tier D retailer adapters: `amazon-pa-api` (SigV4-signed), `walmart` (RSA-signed Affiliate API), `target-redsky` (public visitor key). All three implemented; activate by setting their respective env vars. Until then, the runner returns `NO_CREDENTIALS` errors for private-label brands.
5. 🟡 Validation tooling — `pnpm seed:validate` probes each registry entry's engine + config with one to three live requests, returns pass/fail + hints. Operator runs this to flip `validated: true` per brand.
6. `source_records` + `source_runs` + merge job scaffold once Supabase is wired in (no DB writes yet — runner persists JSON to `staging/` instead).
7. `openfoodfacts-bulk` — broad fill for ingredient/nutrition gaps.
8. `usda-fdc` — additional nutrition fill.
9. `usitc-hts` + manual tariff overlay loader.
10. Crowdsource UI + reputation system (PRD § Stock signals).
11. DTC partnership API integrations replacing scraper adapters as engagements sign.
