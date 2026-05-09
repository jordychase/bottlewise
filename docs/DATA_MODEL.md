# Bottlewise — Data Model

**Companion to**: `PRD.md`
**Implementation target**: Supabase Postgres with pgvector extension

This doc is the schema reference. All migrations should preserve these names and relationships unless explicitly approved to change. Use `// TODO(jordan)` markers in migrations for any field decision flagged in PRD § Open Decisions.

---

## Conventions

- All tables: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()` with a trigger.
- All foreign keys are `on delete restrict` by default; cascades are explicit and rare.
- Append-only tables (prices, stock_signals, recommendations, trial_outcomes) have NO `updated_at` and NO update triggers. New record per change.
- All user-facing text fields use `text`, not `varchar(n)`.
- Money is stored as `numeric(10,2)` in USD cents-precise. No floats.
- Enums implemented as Postgres `enum` types where the value set is closed and stable; otherwise `text` with a `check` constraint.

---

## Core entity tables

### `users`
- `id uuid pk`
- `email text unique not null`
- `display_name text`
- `zip_code text` — for stock localization
- `budget_monthly_cents integer` — null if not specified
- `created_at`, `updated_at`

### `babies`
- `id uuid pk`
- `user_id uuid fk → users(id)`
- `name text` — optional; we accept "Baby" as default
- `dob date not null`
- `sex sex_enum` — `'female' | 'male' | 'unspecified'`
- `birth_weight_grams integer`
- `gestational_age_weeks integer` — for preemie indication eligibility
- `is_active boolean default true` — soft delete
- `created_at`, `updated_at`

### `baby_profiles`
Versioned. New row on every meaningful update. Used to snapshot the profile at the time of a recommendation or trial.
- `id uuid pk`
- `baby_id uuid fk → babies(id)`
- `version integer not null`
- `family_allergy_history jsonb` — `{ cow_milk_protein: bool, soy: bool, peanut: bool, eczema: bool, asthma: bool, other: text[] }`
- `feeding_status feeding_status_enum` — `'exclusive_breastfeeding' | 'mixed' | 'exclusive_formula' | 'transitioning'`
- `current_formula_ids uuid[]`
- `observed_issues text[]` — free list of symptoms parent has flagged
- `transition_intent jsonb` — null unless feeding_status = 'transitioning'
- `created_at`
- Unique on `(baby_id, version)`

---

## Formula knowledge base

### `brands`
- `id uuid pk`
- `name text unique not null`
- `manufacturer_id uuid fk → manufacturers(id)`
- `country_of_origin text` — ISO 3166-1 alpha-2
- `website text`
- `dtc_api_partner boolean default false`

### `manufacturers`
- `id uuid pk`
- `name text unique not null`
- `parent_company text`

### `formulas`
- `id uuid pk`
- `brand_id uuid fk → brands(id)`
- `product_name text not null`
- `stage formula_stage_enum` — `'infant_0_12' | 'toddler_12_plus' | 'preemie' | 'follow_on_eu_2' | 'follow_on_eu_3'`
- `protein_source protein_source_enum` — `'cow_milk' | 'goat_milk' | 'soy' | 'amino_acid' | 'other'`
- `protein_form protein_form_enum` — `'intact' | 'partially_hydrolyzed' | 'extensively_hydrolyzed' | 'amino_acid'`
- `carb_source carb_source_enum[]` — array; many formulas have multiple
- `fat_blend jsonb` — `{ palm_oil: bool, dha_mg_per_100kcal: numeric, ara_mg_per_100kcal: numeric, mfgm: bool }`
- `specialty_designations text[]` — `'organic'`, `'non_gmo'`, `'a2'`, `'kosher'`, `'halal'`, `'lactose_free'`, etc.
- `pediatric_indications text[]` — `'sensitive'`, `'gentle'`, `'anti_reflux'`, `'hypoallergenic'`, `'preemie'`, `'metabolic'`
- `fda_status fda_status_enum` — `'registered' | 'enforcement_discretion' | 'gray_market' | 'unknown'`
- `fda_status_last_verified date`
- `hts_code text` — for tariff calc
- `embedding vector(384)` — pgvector, computed from canonical attribute string. See `docs/AI_DESIGN.md`.
- `is_active boolean default true`
- `created_at`, `updated_at`

### `formula_ingredients`
Full ingredient list for transparency. Separate table because parents care about this.
- `id uuid pk`
- `formula_id uuid fk → formulas(id)`
- `ingredient_name text not null`
- `display_order integer`
- `is_potential_allergen boolean default false`
- `notes text`

### `formula_certifications`
- `id uuid pk`
- `formula_id uuid fk → formulas(id)`
- `certification_type text` — `'usda_organic'`, `'eu_organic'`, `'demeter'`, `'kosher_ou'`, etc.
- `verified boolean default false`

---

## Cost layer

### `prices`
Append-only. New record per price observation.
- `id uuid pk`
- `formula_id uuid fk → formulas(id)`
- `retailer_id uuid fk → retailers(id)`
- `package_size_grams integer not null`
- `package_count integer default 1` — for multi-packs
- `price_cents integer not null`
- `observed_at timestamptz not null default now()`
- `source price_source_enum` — `'msrp' | 'amazon_pa_api' | 'walmart_api' | 'manual' | 'crowdsource'`

### `retailers`
- `id uuid pk`
- `name text unique not null`
- `kind retailer_kind_enum` — `'online' | 'big_box' | 'pharmacy' | 'specialty' | 'dtc'`
- `default_url text`

### `tariff_data`
Versioned. Append-only.
- `id uuid pk`
- `hts_code text not null`
- `country_of_origin text not null`
- `duty_rate_pct numeric(5,2)` — base duty
- `section_301_pct numeric(5,2) default 0`
- `section_232_pct numeric(5,2) default 0`
- `effective_from date not null`
- `effective_to date` — null = current
- `source text` — `'usitc_api'`, `'manual_overlay'`
- `notes text`

### `customs_clearance_estimates`
- `id uuid pk`
- `country_of_origin text not null`
- `port_of_entry text`
- `avg_clearance_days numeric(4,1)`
- `last_computed timestamptz`

---

## Stock signals

### `stock_signals`
Append-only. Confidence decay computed at read time.
- `id uuid pk`
- `formula_id uuid fk → formulas(id)`
- `package_size_grams integer`
- `retailer_id uuid fk → retailers(id)`
- `location_lat numeric(9,6)` — null for online retailers
- `location_lng numeric(9,6)` — null for online retailers
- `store_address text` — for crowdsource local reports
- `signal stock_signal_enum` — `'in_stock' | 'low_stock' | 'out_of_stock'`
- `source signal_source_enum` — `'amazon_pa_api' | 'walmart_api' | 'crowdsource' | 'dtc_api'`
- `reporter_user_id uuid fk → users(id)` — null for API sources
- `observed_at timestamptz not null default now()`

### `crowdsource_reputation`
- `user_id uuid pk fk → users(id)`
- `reports_total integer default 0`
- `reports_corroborated integer default 0`
- `reports_contradicted integer default 0`
- `weight numeric(3,2) default 1.00`
- `last_recomputed timestamptz`

---

## Formula maker settings

### `formula_makers`
- `id uuid pk`
- `manufacturer text not null` — `'Baby Brezza'`, `'Tommee Tippee'`, `'Dr Brown'`
- `model text not null`
- `unique (manufacturer, model)`

### `formula_maker_settings`
- `id uuid pk`
- `formula_id uuid fk → formulas(id)`
- `formula_maker_id uuid fk → formula_makers(id)`
- `setting_label text` — `'Setting 4'`, `'Slow flow'`, etc.
- `scoop_type text` — `'included scoop'`, `'level 8g'`
- `water_to_powder_ratio text` — `'2 oz water : 1 scoop'`
- `notes text`
- `verified_by_user_count integer default 0`
- `disputed_by_user_count integer default 0`

---

## Feedback loop (the flywheel)

### `formula_trials`
A parent's record of trying a formula with a specific baby.
- `id uuid pk`
- `baby_id uuid fk → babies(id)`
- `formula_id uuid fk → formulas(id)`
- `started_on date not null`
- `ended_on date` — null while active
- `baby_profile_version integer not null` — points to `baby_profiles.version` at time of start
- `created_at`, `updated_at`

### `trial_outcomes`
Append-only. A trial can have multiple outcome reports (7-day, 30-day check-ins).
- `id uuid pk`
- `trial_id uuid fk → formula_trials(id)`
- `reported_at timestamptz not null default now()`
- `tolerance tolerance_enum` — `'well' | 'mixed' | 'poor' | 'severe_reaction'`
- `issues_observed text[]` — `'gas'`, `'reflux'`, `'constipation'`, `'fussy'`, `'rash'`, `'allergic_reaction'`, `'feeding_refusal'`, `'spitting_up'`
- `would_recommend_to_similar boolean`
- `notes text` — free text from parent
- `notes_embedding vector(384)` — computed for search and aggregation
- `safety_flag boolean default false` — set if the issue list contains a safety trigger; routes to pediatrician interstitial
- `is_published boolean default true` — controls whether this row enters the public dataset

---

## AI surface tables

### `recommendations`
Snapshot of every recommendation set surfaced to a user. Used for analysis, not display.
- `id uuid pk`
- `user_id uuid fk → users(id)`
- `baby_id uuid fk → babies(id)`
- `baby_profile_version integer not null`
- `flow rec_flow_enum` — `'new_to_formula' | 'on_formula_help' | 'out_of_stock_cascade' | 'cost_substitution'`
- `recommended_formula_ids uuid[]` — ranked
- `avoided_formula_ids uuid[]`
- `reasoning_payload jsonb` — structured score breakdown that fed the narration
- `narration_text text` — what the user actually saw
- `model_version text` — for tracking AI behavior changes
- `reviewing_clinician_id uuid` — null in V1, populated in Phase 2 Tier 2 unlock
- `created_at`

### `substitution_events`
When a user invokes "next closest option" — a learning signal in itself.
- `id uuid pk`
- `user_id uuid fk → users(id)`
- `baby_id uuid fk → babies(id)`
- `original_formula_id uuid fk → formulas(id)`
- `reason substitution_reason_enum` — `'out_of_stock' | 'too_expensive' | 'not_tolerated' | 'recalled' | 'preference'`
- `suggested_formula_ids uuid[]`
- `selected_formula_id uuid` — null if user didn't pick one
- `created_at`

### `chat_sessions` and `chat_messages`
Standard chat schema. Each session pinned to a `flow` enum and a `baby_id`.
- `chat_sessions`: `id`, `user_id`, `baby_id`, `flow`, `started_at`, `ended_at`
- `chat_messages`: `id`, `session_id`, `role` (`'user' | 'assistant' | 'system' | 'safety_interstitial'`), `content`, `tool_calls jsonb`, `safety_triggered boolean default false`, `created_at`

---

## Indexes

Critical (specify in initial migration):
- `formulas.embedding` — ivfflat or hnsw, cosine ops, lists tuned to ~200 formula scale (lists=10 initially, retune at 1000+ formulas)
- `prices(formula_id, observed_at desc)`
- `stock_signals(formula_id, retailer_id, observed_at desc)`
- `stock_signals` GIST index on `(location_lat, location_lng)` for crowdsource geo queries
- `formula_trials(baby_id, started_on desc)`
- `trial_outcomes(trial_id, reported_at desc)`
- `recommendations(user_id, created_at desc)`

---

## RLS policies

Every user-scoped table gets row-level security. Default policy: a user can read and write only their own rows.

Public-readable tables (no RLS, or RLS allowing all reads): `formulas`, `formula_ingredients`, `formula_certifications`, `brands`, `manufacturers`, `retailers`, `tariff_data`, `customs_clearance_estimates`, `formula_makers`, `formula_maker_settings`.

Aggregated public dataset (`trial_outcomes` where `is_published = true`): readable via a security-definer view that strips `user_id`, `baby_id`, and `notes` (notes contain identifying information; only `notes_embedding` is published for similarity search).

---

## Open schema decisions (require Jordan confirmation)

1. **`baby_profiles` versioning strategy.** Brief proposes new row per meaningful change with a separate `version` integer. Alternative: temporal tables via `tstzrange`. Chose the simpler approach for V1; flag if you'd prefer the temporal pattern.
2. **`prices` package normalization.** Brief stores raw `package_size_grams` and `package_count`, computes per-oz at read time. Alternative: precompute and store. Read-time keeps the schema honest, costs ~nothing at this scale.
3. **`embedding` dimension.** Brief specifies 384, which matches several open-weights small models (e.g., all-MiniLM-L6-v2). If using OpenAI embeddings or Voyage, retune to 1536 or 1024 respectively.
4. **`affiliate_link` table.** Not included pending PRD § Open Decisions item 2. If affiliate revenue is approved, this gets added in the same migration as `prices` so URLs are first-class.
5. **`pediatric_review` table.** Not included in V1. Reserved for Tier 2 unlock.
