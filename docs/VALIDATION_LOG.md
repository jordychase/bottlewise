# Validation log

Append-only record of registry validation passes. Each entry summarizes a `pnpm seed:validate` run and the registry edits that followed it. Concrete data, not speculation.

---

## 2026-05-09 — Initial sweep

**Result: 12 pass, 26 fail, 9 skipped (no credentials).**

### Validated working (12)

Confirmed engine + config produce a sane response. Eligible to flip `validated: true` once the operator inspects the actual catalog output.

| Brand | Engine | Evidence |
|---|---|---|
| enfamil | html | selector matched 15 product links |
| up-and-up | retailer_api (target) | 1 result returned |
| bobbie | shopify | products.json returned products |
| serenity-kids | shopify | products.json returned products |
| else-nutrition | shopify | products.json returned products |
| hipp-us-importer | shopify | products.json returned products (organicsbestshop.com) |
| lebenswert | shopify | products.json returned products (organicsbestshop.com) |
| loulouka | shopify | products.json returned products (organicsbestshop.com) |
| holle-goat | shopify | products.json returned products (organicsbestshop.com) |
| aussie-bubs | shopify | products.json returned products |
| bubs-australia | shopify | products.json returned products |
| kabrita | shopify | products.json returned products |

### Engine swaps applied

Probe evidence proved the original engine choice was wrong; switched in the same commit:

| Brand | Was | Now | Reason |
|---|---|---|---|
| byheart | jsonld | html | site has no JSON-LD blocks |
| earthly-origins | shopify | html | products.json returned HTML, not JSON |
| nannycare | jsonld | html | JSON-LD present but no Product schema |
| a2-platinum | jsonld | html | JSON-LD present but no Product schema |
| neocate | jsonld | html | no JSON-LD on listing page |

### Marked partnership_only

Anti-bot 403s won't be solved by config changes. Set `scrape_status: 'partnership_only'` so the runner skips them; data will come via brand engagement feed once signed:

| Brand | Status | Reason |
|---|---|---|
| gerber-good-start | partnership_only | gerber.com returns 403 to bot UAs |
| gerber-extensive-ha | partnership_only | same — Nestlé site is anti-bot |

### Pending investigation (URL 404s)

Listing URLs returned 404 — most are likely path changes the brand made since the registry was seeded. Each needs an operator to find the current listing URL and update the registry. Did NOT auto-guess to avoid silent breakage.

| Brand | Symptom |
|---|---|
| similac | /baby-formula.html → 404 |
| earths-best-organic | /products/baby-formula → 404 |
| happy-baby-organic | /products/category/infant-formula/ → 404 |
| munchkin-grass-fed | /grass-fed-formula → 404 |
| burts-bees-baby-organic | /formula → 404 |
| hipp-de | /baby-ernaehrung/anfangsmilch/ → 404 (possibly geo-blocked too) |
| hipp-uk | /baby-milk/ → 404 |
| hipp-nl | /babyvoeding/zuigelingenvoeding/ → 404 |
| holle | /en/our-products → 404 |
| kendamil | /collections/all-formula → 404 |
| kendamil-goat | /collections/goat → 404 |
| topfer | /produkte/ → 404 |
| nutramigen | /products/nutramigen-with-enflora-lgg/ → 404 |
| alimentum | /baby-formula/alimentum.html → 404 |
| pregestimil | /products/pregestimil/ → 404 |
| puramino | /products/puramino/ → 404 |
| neosure | /baby-formula/neosure.html → 404 |
| enfacare | /products/enfacare/ → 404 |
| elecare | /products → 404 |

**Pattern**: the Mead Johnson / Abbott sub-brand pages all 404. The umbrella sites (enfamil.com, similac.com) likely consolidated sub-brand info into a single hub. The fix probably routes these sub-brands through the umbrella adapter with a brand-specific path filter, rather than per-sub-brand listing URLs.

**Mead Johnson sub-brand consolidation applied 2026-05-09 (same commit as the merge layer):**
- nutramigen, pregestimil, puramino, enfacare → all routed through `enfamil.com/products/` umbrella URL (which probe-validated as working) with case-insensitive sub-brand keyword filters: `a[href*='nutramigen' i]`, etc. Pending re-probe confirmation.
- Abbott consolidation (alimentum, neosure → similac umbrella) deferred until similac.com base URL is operator-confirmed.

### Skipped — credentials needed (9)

Private-label brands route to Tier D retailer adapters. Validation is gated on the corresponding env vars being set:

| Brand | Retailer | Required env |
|---|---|---|
| parents-choice | walmart | `WALMART_CONSUMER_ID`, `WALMART_PRIVATE_KEY` |
| comforts | walmart, amazon | both |
| members-mark | walmart | walmart |
| kirkland-signature | amazon | `AMAZON_PA_*` |
| mama-bear | amazon | amazon |
| berkley-jensen | amazon | amazon |
| tippy-toes | amazon | amazon |
| cvs-health | amazon | amazon |
| heb-baby | amazon | amazon |

`up-and-up` passed because Target RedSky doesn't require credentials.

### Next pass

Re-run `pnpm seed:validate` after:
1. Operator updates the 19 stale URLs (or replaces sub-brand entries with umbrella-routed configs)
2. `AMAZON_PA_*` and `WALMART_*` env vars are set (post-Affiliate-program approval)

Target on the next pass: 35+ pass, 0 fail. Remaining fails should be either partnership_only brands or known-incomplete sub-brand consolidation.
