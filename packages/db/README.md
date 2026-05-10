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

# Live run for one brand, persisting raw + normalized payloads
pnpm --filter @bottlewise/db run seed -- --brand=bobbie --out=./staging

# Live run for an entire segment
pnpm --filter @bottlewise/db run seed -- --segment=european_import --out=./staging
```

CLI flags (`packages/db/src/sources/bin/seed.ts`):
- `--list` — print every brand grouped by segment
- `--dry` — dispatch-only, no network requests
- `--brand=<id>` — single brand
- `--segment=<segment>` — all brands in a segment (`mass_market`, `premium_dtc`, `european_import`, ...)
- `--limit=<n>` — cap brand count
- `--out=<dir>` — persist raw + normalized JSON per brand

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
