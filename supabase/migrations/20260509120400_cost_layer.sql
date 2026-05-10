-- Pricing + tariff + customs. Per DATA_MODEL.md § Cost layer.

create table retailers (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  kind retailer_kind_enum not null,
  default_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Append-only. New record per price observation.
create table prices (
  id uuid primary key default gen_random_uuid(),
  formula_id uuid not null references formulas(id) on delete restrict,
  retailer_id uuid not null references retailers(id) on delete restrict,
  package_size_grams integer not null check (package_size_grams > 0),
  package_count integer not null default 1 check (package_count > 0),
  price_cents integer not null check (price_cents >= 0),
  observed_at timestamptz not null default now(),
  source price_source_enum not null,
  source_url text,
  created_at timestamptz not null default now()
);
create index on prices(formula_id, observed_at desc);
create index on prices(retailer_id, observed_at desc);

-- Append-only. Tariff schedules with effective windows.
create table tariff_data (
  id uuid primary key default gen_random_uuid(),
  hts_code text not null,
  country_of_origin text not null,
  duty_rate_pct numeric(5,2) not null default 0,
  section_301_pct numeric(5,2) not null default 0,
  section_232_pct numeric(5,2) not null default 0,
  effective_from date not null,
  effective_to date,
  source text not null,
  notes text,
  created_at timestamptz not null default now()
);
create index on tariff_data(hts_code, effective_from desc);
create index on tariff_data(country_of_origin, effective_from desc);

create table customs_clearance_estimates (
  id uuid primary key default gen_random_uuid(),
  country_of_origin text not null,
  port_of_entry text,
  avg_clearance_days numeric(4,1) not null,
  last_computed timestamptz not null default now(),
  unique (country_of_origin, port_of_entry)
);
