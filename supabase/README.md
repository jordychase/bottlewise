# Supabase migrations

Schema for Bottlewise. Maps directly to `docs/DATA_MODEL.md` plus the source-layer additions from `docs/DATA_SOURCING.md` § 8.

## Layout

```
supabase/
├── config.toml                              # Local Supabase project config
└── migrations/
    ├── 20260509120000_extensions.sql        # pgcrypto, vector, citext
    ├── 20260509120100_enums.sql             # all enum types
    ├── 20260509120200_users_and_babies.sql  # users, babies, baby_profiles
    ├── 20260509120300_formula_kb.sql        # brands, manufacturers, formulas, ingredients, certifications, recalls
    ├── 20260509120400_cost_layer.sql        # prices, retailers, tariff_data, customs_clearance_estimates
    ├── 20260509120500_stock_signals.sql     # stock_signals, crowdsource_reputation
    ├── 20260509120600_makers.sql            # formula_makers, formula_maker_settings
    ├── 20260509120700_feedback.sql          # formula_trials, trial_outcomes
    ├── 20260509120800_ai_surfaces.sql       # recommendations, substitution_events, chat_sessions, chat_messages
    ├── 20260509120900_source_layer.sql      # source_records, source_runs, source_conflicts
    ├── 20260509121000_indexes.sql           # pgvector + geo + active-row indexes
    ├── 20260509121100_triggers.sql          # updated_at + recall denormalization
    └── 20260509121200_rls.sql               # row-level security + public dataset view
```

## Apply locally

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
brew install supabase/tap/supabase
cd /path/to/bottlewise
supabase init    # one-time, if not already initialized
supabase start   # spins up Postgres + Auth + Storage in Docker
supabase db reset  # applies every migration in /supabase/migrations
```

Studio at http://localhost:54323, API at http://localhost:54321, Postgres on 54322.

## Apply to a remote project

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

## Schema highlights

- **Public-readable knowledge base**: `formulas`, `formula_ingredients`, `formula_certifications`, `brands`, `manufacturers`, `retailers`, `tariff_data`, `customs_clearance_estimates`, `formula_makers`, `formula_maker_settings`, `formula_recalls`. No RLS.
- **User-scoped via RLS**: `users`, `babies`, `baby_profiles`, `formula_trials`, `trial_outcomes`, `recommendations`, `substitution_events`, `chat_sessions`, `chat_messages`, `stock_signals`, `crowdsource_reputation`.
- **Public dataset surface**: `public_trial_outcomes` view, security-definer, strips user/baby identifiers, omits raw notes (only `notes_embedding` is published).
- **Recall denormalization**: `formulas.recalled_at` is kept in sync by the `trg_formula_recalls_sync` trigger. The recommendation engine and out-of-stock cascade flow can filter on this column without joining.
- **Source attribution**: `formulas.provenance jsonb` carries `{ field: { source_id, observed_at } }` for every populated field. The merge layer reads `source_records` and writes provenance alongside canonical values.

## Connecting `@bottlewise/db` adapters

The runner currently writes to `staging/<brand>/<ts>.json`. Once the schema is applied, the merge job ([packages/db/src/sources/runner.ts](../packages/db/src/sources/runner.ts)) will instead upsert into `source_records` and trigger the canonical-merge job. That swap lands in the merge-layer commit (next phase).
