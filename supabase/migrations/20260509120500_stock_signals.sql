-- Stock signals + crowdsource reputation. Per DATA_MODEL.md § Stock signals.

-- Append-only. Confidence decay computed at read time.
create table stock_signals (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid not null references formulas(id) on delete restrict,
  package_size_grams integer,
  retailer_id uuid not null references retailers(id) on delete restrict,
  location_lat numeric(9,6),
  location_lng numeric(9,6),
  store_address text,
  signal stock_signal_enum not null,
  source signal_source_enum not null,
  reporter_user_id uuid references users(id) on delete set null,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index on stock_signals(formula_id, retailer_id, observed_at desc);
create index on stock_signals(retailer_id, observed_at desc);
create index on stock_signals(reporter_user_id, observed_at desc) where reporter_user_id is not null;

create table crowdsource_reputation (
  user_id uuid primary key references users(id) on delete cascade,
  reports_total integer not null default 0,
  reports_corroborated integer not null default 0,
  reports_contradicted integer not null default 0,
  weight numeric(3,2) not null default 1.00,
  last_recomputed timestamptz not null default now()
);
