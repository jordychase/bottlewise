# @bottlewise/db

Database layer for Bottlewise: source adapters, schema, migrations, and seed.

V1 scope is **source adapters**. The rest (Supabase migrations, types) lands once Open Decisions on stack and license are resolved (see `/CLAUDE.md` and `/docs/PRD.md` § Open Decisions).

## Source adapters

Adapters fetch formula data from upstream sources, normalize it into the shape of the `formulas` + `formula_ingredients` tables, and emit JSON for the merge layer to consume. See `/docs/DATA_SOURCING.md` for the full spec — this README is the operator-facing quickstart.

### Architecture

Three engines cover most brand sites without per-site code:

| Engine | When it works | Coverage |
|---|---|---|
| **shopify** | Storefront exposes `/products.json` | Most modern DTC brands (Bobbie, Serenity Kids, Else Nutrition, Kabrita, Aussie Bubs, ...) |
| **jsonld** | Site embeds schema.org Product markup | Many corporate sites; some modern DTC |
| **html** | Neither — needs per-brand selectors | Legacy big-brand sites (Enfamil, Similac, regional HiPP) |

Plus two non-DTC dispatchers:

| Engine | Behavior |
|---|---|
| **retailer_api** | Brand has no DTC site; sourced via Amazon PA-API / Walmart Open API / Target RedSky. Stub today; wired up in the retailer-source phase. |
| **manual_only** | NICU / prescription formulas with no public presence; loaded via curator CSVs. |

### Run it

```bash
pnpm install

# Inspect the registry
pnpm seed:list

# Dry run — dispatch every brand without fetching anything
pnpm seed:dry

# Validate every registry entry (1–3 probe requests per brand)
pnpm seed:validate

# Live run for one brand, persisting raw + normalized payloads to disk
pnpm --filter @bottlewise/db run seed -- --brand=bobbie --out=./staging

# Live run, persisting to Supabase source_records (requires SUPABASE_URL +
# SUPABASE_SERVICE_ROLE_KEY)
pnpm --filter @bottlewise/db run seed -- --brand=bobbie --db

# Run the canonical merge: source_records → formulas + formula_ingredients
pnpm merge -- --brand=bobbie
pnpm merge -- --since=2026-05-01 --dry

# FDA gate: submissions list + openFDA recalls
pnpm fda --out=./staging/fda
pnpm fda --recalls-only --since=2024-01-01
```

CLI flags (`packages/db/src/sources/bin/seed.ts`):
- `--list` — print every brand grouped by segment
- `--dry` — dispatch-only, no network requests
- `--validate` — probe each entry's engine + config; reports pass/fail + hints
- `--brand=<id>` — single brand
- `--segment=<segment>` — all brands in a segment (`mass_market`, `premium_dtc`, `european_import`, ...)
- `--limit=<n>` — cap brand count
- `--out=<dir>` — persist raw + normalized JSON per brand
- `--db` — persist to Supabase `source_records` + `source_runs` (requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`)

### Merge layer

`packages/db/src/sources/merge.ts` implements the canonical-merge logic from `docs/DATA_SOURCING.md` § 4. Flow:

1. `pnpm seed --db` writes adapter outputs to `source_records` + telemetry to `source_runs`.
2. `pnpm merge` reads recent source_records, groups by `(brand_registry_id, external_id)`, walks each field through the precedence rules, and upserts canonical formulas + formula_ingredients into the public-readable knowledge base.
3. Every conflicting field overwrite is recorded in `source_conflicts` for audit.

Per-field precedence (most→least; FIELD_PRECEDENCE in `merge.ts`):
- `pediatricIndications`: brand_dtc, manual ONLY (clinical claims must come from brand)
- `ingredients`: brand_dtc → community → retailer
- `proteinSource`, `proteinForm`, `fatBlend`, `carbSources`, `specialtyDesignations`: brand_dtc → community
- `msrpUsdCents`: retailer → brand_dtc (retailer reflects actual market price)
- Other fields: tier rank wins (authoritative > manual > brand_dtc > community > retailer), then most-recent observation as tiebreaker

The pure functions (`pickByPrecedence`, `buildCanonical`, `tierOf`) are unit-tested without a database round-trip; DB-touching functions (`writeSourceRecords`, `mergeCanonical`) are exercised live once Supabase is wired in.

### Tier D retailer adapters

Private-label brands (Parent's Choice, Up & Up, Comforts, Kirkland, Mama Bear, Berkley Jensen, Tippy Toes, CVS Health, HEB, Member's Mark) ship with no DTC site. Their registry entries route to `retailer_api` and dispatch to one or more of:

| Retailer | Adapter | Auth | Required env |
|---|---|---|---|
| Amazon | `amazon-pa-api.ts` | AWS SigV4 | `AMAZON_PA_ACCESS_KEY`, `AMAZON_PA_SECRET_KEY`, `AMAZON_PA_ASSOCIATE_TAG` |
| Walmart | `walmart.ts` | RSA-signed (Affiliate API) | `WALMART_CONSUMER_ID`, `WALMART_PRIVATE_KEY`, `WALMART_PRIVATE_KEY_VERSION` |
| Target | `target-redsky.ts` | Public visitor key (rotates) | `TARGET_REDSKY_VISITOR_KEY` (optional override) |

Without credentials, the runner returns `NO_CREDENTIALS` errors for the affected brands and skips. Target works without explicit credentials but the visitor key may need periodic rotation.

### FDA gate adapter

`packages/db/src/sources/adapters/fda-submissions.ts` parses the FDA Infant Formula Submissions HTML page into structured records. The gate principle (DATA_SOURCING.md § 1) means a formula doesn't surface to users unless its brand + product appear in this list (or a curator overlay marks it `enforcement_discretion`).

`packages/db/src/sources/adapters/openfda-recalls.ts` polls `api.fda.gov/food/enforcement.json` for infant-formula keywords. Class I events are isolated for downstream notification + recommendation downrank.

Run both via `pnpm fda` (full sweep) or `pnpm fda --submissions-only` / `--recalls-only` for individual paths.

### Validation status

Every entry in `src/sources/registry.ts` ships with `validated: false`. That flag is the operator's checkbox: it means "engine + config are an informed guess, smoke test before relying on this." Flip to `true` once a brand's adapter returns a sane catalog.

A real validation pass for one brand looks like:

1. `pnpm seed -- --brand=<id> --out=./staging`
2. Inspect `staging/<id>/<ts>.json` — does `recordsSeen` look right? Are ingredients present? Does `fieldCoverage` look populated?
3. If yes → set `validated: true` in the registry.
4. If selectors are off → fix the registry config; rerun.
5. If the engine is wrong (e.g., a "shopify" brand is actually on a custom platform) → swap the engine in the registry.

### Coverage today

Run `pnpm seed:list` for the live count. As of this commit:

- ~50 brands across mass-market, private-label / WIC-budget, premium DTC, European imports, hypoallergenic, amino-acid elemental, preemie post-discharge, goat milk, A2, plant-based, and toddler.
- 0 validated. All entries need a smoke pass before live runs.
- Private-label brands (Parent's Choice, Up&Up, Comforts, Kirkland, Mama Bear, etc.) route to `retailer_api` since they have no DTC site. Those return placeholder errors today; a Tier D adapter (Amazon PA-API + Walmart Open API + Target RedSky) lands in the next phase.

### Scraping policy

The polite-HTTP client (`src/sources/http.ts`) enforces:
- Identifying User-Agent: `Bottlewise/{version} (+https://github.com/jordychase/bottlewise; data@bottlewise.app)`
- 5-second minimum between requests per origin (30s for `fda.gov`)
- Retry only on 5xx, with exponential backoff capped at 60s
- 4xx is fail-fast (no retry storms against forbidden endpoints)

Robots.txt parsing and per-origin caching are TODO — see `/docs/DATA_SOURCING.md` § 7.

If a brand asks us to stop scraping, set `scrapeStatus: "opted_out"` in the registry. The runner will skip them on every subsequent run; existing data is retained but staled.

### Tests

```bash
pnpm --filter @bottlewise/db run test
```

Tests use HTML / JSON fixtures (`src/sources/tests/fixtures/`). No live scraping in CI.
