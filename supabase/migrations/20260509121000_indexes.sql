-- Cross-table indexes that don't naturally live in their domain migration.
-- Critical-path indexes per DATA_MODEL.md § Indexes.

-- pgvector indexes. lists tuned for the ~50-formula initial scale; retune
-- with `set ivfflat.probes` and `alter index ... set (lists = ...)` once
-- the catalog grows past 1000 rows.
create index formulas_embedding_idx
  on formulas using ivfflat (embedding vector_cosine_ops) with (lists = 10);

create index trial_outcomes_notes_embedding_idx
  on trial_outcomes using ivfflat (notes_embedding vector_cosine_ops)
  with (lists = 10);

-- Geo index for crowdsource stock reports.
create index stock_signals_location_idx
  on stock_signals (location_lat, location_lng)
  where location_lat is not null;

-- Active-only partial indexes that the query planner reaches for in hot paths.
create index formulas_active_idx
  on formulas(brand_id, product_name) where is_active = true;
create index babies_active_idx
  on babies(user_id) where is_active = true;
